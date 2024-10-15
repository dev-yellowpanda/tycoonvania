import { Interpolator, InterpolatorLatency, PlayerId } from 'dusk-games-sdk';
import { GameState, LevelUpValues, MapScale, PlayerMaxSpeed } from '../../logic';
import { GameBaseProps } from '../../GameBase';
import { VillagerInfo } from './Villager';
import { VectorHelp } from '../../VectorHelp';
import { WorldMethods } from '../../physics/World';
import { AudioPlayerMethods } from './AudioPlayer';
// import { TutorialArrowMethods } from './TutorialArrow';

// A fita aqui é a seguinte: O dusk por algum motivo não gosta da keyword "this", o que significa q não dá pra usar orientação a objeto
//pura do typescript.
//O workaround foi separar a classe do player em "PlayerData", que é um type apenas, e os métodos ficam numa classe estática "PlayerMethods"
//que recebem o player como parâmetro do método
//Então sempre que quiser adicionar uma propriedade nova, adiciona no "PlayerData", e quando quisaer adicionar um método novo, adiciona
//no "PlayerMethods"

//A diferença entre PlayerInfo e PlayerData é que o PlayerInfo são as informações que são compartilhadas pela rede
//PlayerData são as propriedades especificas do phaser como Sprite, etc, q nao precisam ser passadas pela rede

//O mesmo se aplica pro Villager


export enum PlayerTeam {
    Red = 0,
    Blue = 1,
    Green = 2,
    Yellow = 3,
    None = 4
}

export type PlayerInfo = {
    playerId: PlayerId,
    playerTeam: PlayerTeam,
    bloodCount: number,
    rankingScore: number,
    playerMoving: boolean,
    xDirection: number,
    playerPos: number[],
    axisSpeed: number[],
    bodyId: string,
    purchased: number[]
};

export type PlayerData = {

    playerInfo: PlayerInfo,
    teamSpriteTag: string[],

    playerSprite: Phaser.GameObjects.Sprite | undefined,
    bloodLabel: Phaser.GameObjects.Text | undefined,

    onlineInterpolator: InterpolatorLatency<number | number[]> | undefined,
    localInterpolator: Interpolator<number | number[]> | undefined,

    phaserScene: Phaser.Scene,
    isLocal: boolean,
    game: GameBaseProps,

    currentAnimation: string,
    lerpPosition: number[],

    lastPurchasedStatus: number[],
    lastRankingScore: number,
    targetAim: Phaser.GameObjects.Sprite | undefined,
    spriteTarget: Phaser.GameObjects.Sprite | undefined,
    walkAudio: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound,
    walkVolumeFade: number,
    purchasing: boolean
}

export class PlayerMethods {

    public static construct(
        game: GameBaseProps,
        phaserScene: Phaser.Scene,
        playerInfo: PlayerInfo,
        localInterpolator: Interpolator<number | number[]> | undefined,
        isLocal: boolean,
    ) {
        const player: PlayerData = {
            playerInfo: playerInfo,
            teamSpriteTag: PlayerMethods.GetTeamSprite(playerInfo.playerTeam),
            playerSprite: undefined,
            // bloodLabel: phaserScene.add.text(0, 0, "Blood: 0", { font: '150px Arial', align: "center" }),
            bloodLabel: undefined,
            phaserScene: phaserScene,
            onlineInterpolator: (Dusk.interpolatorLatency({ maxSpeed: PlayerMaxSpeed })),
            localInterpolator: localInterpolator,
            isLocal: isLocal,
            game: game,
            currentAnimation: "",
            lerpPosition: playerInfo.playerPos,
            lastPurchasedStatus: playerInfo.purchased,
            lastRankingScore: playerInfo.rankingScore,
            targetAim: phaserScene.add.sprite(0, 0, "Blood"),
            spriteTarget: undefined,
            walkAudio: phaserScene.sound.add("steps"),
            walkVolumeFade: 0,
            purchasing: false
        };

        //player.teamSpriteTag[0] -> Idle
        //player.teamSpriteTag[1] -> Walk

        player.playerSprite = phaserScene.add.sprite(0, 0, player.teamSpriteTag[0]);
        player.playerSprite.setScale(MapScale);
        player.playerSprite.setOrigin(0.5, 1);

        phaserScene.anims.create({
            key: player.teamSpriteTag[0],
            frames: phaserScene.anims.generateFrameNumbers(player.teamSpriteTag[0], { frames: [0, 1, 2, 3, 4] }),
            frameRate: 10,
            repeat: -1
        })

        phaserScene.anims.create({
            key: player.teamSpriteTag[1],
            frames: phaserScene.anims.generateFrameNumbers(player.teamSpriteTag[1], { frames: [0, 1, 2, 3, 4] }),
            frameRate: 10,
            repeat: -1
        })

        player.currentAnimation = player.teamSpriteTag[0];
        player.playerSprite.play(player.currentAnimation);

        player.onlineInterpolator!.update({
            game: playerInfo.playerPos,
            futureGame: playerInfo.playerPos,
        })

        if (player.isLocal) {
            phaserScene.cameras.main.setZoom(0.25)
            phaserScene.cameras.main.startFollow(player.targetAim, true, 0.1, 0.1)
        }

        player.spriteTarget = player.playerSprite;
        player.targetAim.setPosition(player.spriteTarget.x, player.spriteTarget.y);

        return player;
    }

    public static refresh(self: PlayerData, isLocal: boolean) {
        if (self.isLocal == isLocal) return
        self.isLocal = isLocal
    }

    public static update(self: PlayerData, game: GameBaseProps) {
        if (!self) return;

        const body = game.game.world.bodies[self.playerInfo.bodyId];

        if (self.isLocal && !self.phaserScene.scene.isActive("Pause") && !self.purchasing) {
            game.setBlockClientInputs(false);
        }

        if (body) {
            const lerp = VectorHelp.lerp;
            self.lerpPosition = lerp(self.lerpPosition, body.position, 0.1);
        }

        self.playerSprite?.setPosition(
            self.lerpPosition[0],
            self.lerpPosition[1] + 70
        )
        self.playerSprite!.depth = self.playerSprite!.y

        self.targetAim.setPosition(
            self.spriteTarget.x,
            self.spriteTarget.y
        );

        // self.bloodLabel?.setPosition(
        //     self.lerpPosition[0] - self.bloodLabel.width / 2,
        //     self.lerpPosition[1] + 50
        // )
        // self.bloodLabel.setColor(self.isLocal ? "red" : "white");

        //CHAMAR AUDIO STEPS DO PLAYER
        if (self.playerInfo.playerMoving) {
            self.walkVolumeFade += (1 - self.walkVolumeFade) / 10.0
        }
        else {
            self.walkVolumeFade += (0 - self.walkVolumeFade) / 10.0
        }

        const magnitude = VectorHelp.magnitude;

        const audioDistance =
            magnitude([
                self.playerSprite.x - self.phaserScene.cameras.main.scrollX,
                self.playerSprite.y - self.phaserScene.cameras.main.scrollY
            ]) / 1000.0


        const vol = Math.min(1, (1 / (audioDistance * audioDistance)));

        self.walkAudio.setVolume(self.walkVolumeFade * vol * 2);
        if (!self.phaserScene.sound.locked && !self.walkAudio.isPlaying) {
            self.walkAudio.play();
        }

        // self.bloodLabel?.setText(
        //     "Blood: " + Math.max(0, Math.floor(self.playerInfo.bloodCount)) +
        //     "\nInput Blocked: " + game.blockClientInputs
        // );
        // self.bloodLabel!.depth = self.playerSprite!.depth + 1;

        if (self.playerInfo.playerMoving && self.currentAnimation == self.teamSpriteTag[0]) {
            self.currentAnimation = self.teamSpriteTag[1];
            self.playerSprite.play(self.currentAnimation);
        }

        if (!self.playerInfo.playerMoving && self.currentAnimation == self.teamSpriteTag[1]) {
            self.currentAnimation = self.teamSpriteTag[0];
            self.playerSprite.play(self.currentAnimation);
        }

        self.playerSprite.scaleX = self.playerInfo.xDirection * MapScale;

        // if(game.yourPlayerId === self.playerInfo.playerId){   
        //     if (game.tutorialRunning && game.tutorialArrow.internalTutorialStep === 0 && self.playerInfo.bloodCount >= 50) {
        //         TutorialArrowMethods.NextStep(game.tutorialArrow, 1, game);
        //     }
        // }

        for (let i = 0; i < self.playerInfo.purchased.length; i++) {
            if (self.lastPurchasedStatus.find(p => p == self.playerInfo.purchased[i]) == undefined) {
                //Acabou de comprar
                let count = 0;
                const purchased = self.playerInfo.purchased[i];

                //CHAMAR AUDIO DE COMPRA SUMINDO
                if (!game.avoidAudio)
                    AudioPlayerMethods.playSFX(self.phaserScene, 'dismissPurchasePlatform', 0.3)

                const toBeEnabled = game.ingamePurchaseSensors[purchased].info.enables;
                const decoCount = toBeEnabled.map(id => game.ingameDecorations[id]).filter(m => m !== undefined).length;

                if (decoCount > 0) {
                    //CHAMAR AUDIO DE ESTRUTURA APARECENDO
                    if (!game.avoidAudio)
                        AudioPlayerMethods.playSFX(self.phaserScene, 'buildingRoom', 0.3)
                }

                game.ingamePurchaseSensors[purchased].tweenFade.play();
                //Desliga input do player
                self.purchasing = true;
                game.setBlockClientInputs(true);

                //Mostr a camera pra todos os itens q ele ligou
                for (let j = 0; j < game.ingamePurchaseSensors[purchased].info.enables.length; j++) {
                    const enabledID = game.ingamePurchaseSensors[purchased].info.enables[j];

                    const padPurchased = game.ingamePurchaseSensors[enabledID];
                    if (padPurchased) {
                        //Foca a camera nele

                        //fica 1 segundo nele

                        if (self.isLocal) {
                            self.phaserScene.time.delayedCall(count * 1000 + 250, () => {
                                self.spriteTarget = padPurchased.sprite;
                            });

                            self.phaserScene.time.delayedCall(count * 1000 + 500, () => {
                                padPurchased.tweenScale.play();
                                if (!game.avoidAudio)
                                    AudioPlayerMethods.playSFX(self.phaserScene, 'buildingRoom', 0.3)
                            });
                        }
                        else {
                            padPurchased.tweenScale.play();
                        }

                        count++;
                    }
                }

                if (self.isLocal) {
                    self.phaserScene.time.delayedCall(count * 1000 + 250, () => {
                        self.spriteTarget = self.playerSprite;
                        game.setBlockClientInputs(false);
                        self.purchasing = false;
                        //Liga input do player
                    });
                }
                else {
                    self.purchasing = false;
                }
            }
        }



        if (self.lastRankingScore !== self.playerInfo.rankingScore) {

            for (let i: number = 0; i < LevelUpValues.length; i++) {
                if (self.playerInfo.rankingScore == LevelUpValues[i]) {
                    //CHAMAR AUDIO LEVELUP
                    if (!game.avoidAudio)
                        AudioPlayerMethods.playSFX(self.phaserScene, 'levelUp', 0.3)
                    break;
                }
            }
        }

        self.lastPurchasedStatus = self.playerInfo.purchased;
        self.lastRankingScore = self.playerInfo.rankingScore;
    }


    public static serverUpdate(game: GameState, player: PlayerInfo) {

        const add = VectorHelp.vectorSum;
        player.playerPos = add(player.playerPos, player.axisSpeed);

        const body = game.world.bodies[player.bodyId];
        body.velocity = player.axisSpeed;

        //Procura os villagers que estão próximos
        for (let i = 0; i < game.villagersList.length; i++) {
            const villager: VillagerInfo = game.villagersList[i];

            const playerPos = body.position;

            const distance = VectorHelp.distanceFrom(villager.position, playerPos);

            if (distance < 500) {
                if (!villager.playersInRange.includes(player.playerId)) {
                    villager.playersInRange.push(player.playerId);
                }
            }
            else {
                if (villager.playersInRange.includes(player.playerId)) {
                    villager.playersInRange.splice(villager.playersInRange.indexOf(player.playerId));
                }
            }
        }

        //Dá o sangue por minuto baseado no q o player tem comprado
        for (let i = 0; i < player.purchased.length; i++) {
            const purchase = game.purchaseSensors[player.purchased[i]];

            for (let j = 0; j < purchase.enables.length; j++) {
                const enabledID = purchase.enables[j];

                const decoration = game.decorations[enabledID];
                if (decoration) {
                    const bloodPerFrame = decoration.bloodPerMinute / 60.0 / 30.0;
                    player.bloodCount += bloodPerFrame;
                }
            }
        }
    }

    public static getPosition(player: PlayerData) {
        if (player === undefined) return;

        if (player.isLocal) {
            return player.localInterpolator?.getPosition() as number[];
        }
        else {
            return player.onlineInterpolator?.getPosition() as number[];
        }
    }

    public static GetTeamSprite(playerTeam: PlayerTeam) {


        switch (playerTeam) {
            case PlayerTeam.Red:
                return ["Red_Idle", "Red_Walk"]
            case PlayerTeam.Blue:
                return ["Blue_Idle", "Blue_Walk"]
            case PlayerTeam.Green:
                return ["Green_Idle", "Green_Walk"]
            case PlayerTeam.Yellow:
                return ["Yellow_Idle", "Yellow_Walk"]
        }
    }

    public static destroyServer(self: PlayerInfo, game: GameState) {

        for (let i = self.purchased.length - 1; i >= 0; i--) {

            const purchasePad = game.purchaseSensors[self.purchased[i]];

            purchasePad.visible = true;//Liga de volta
            purchasePad.paid = 0;

            purchasePad.enables.forEach(id => { //Desliga todos os objetos no "enables"
                const obj = game.purchaseSensors[id]; //Procura no purchaseSensors
                if (obj) {
                    obj.visible = false;
                }

                const deco = game.decorations[id];
                if (deco) {
                    deco.visible = false;
                }
                //Procura em outras listas q esse objeto pode estar


            });
        }
    }

    public static destroy(self: PlayerData) {
        if (!self) return;
        WorldMethods.RemoveBody(self.playerInfo.bodyId, self.game.game.world);
        self.playerSprite!.destroy();
        // self.bloodLabel!.destroy();
    }
}