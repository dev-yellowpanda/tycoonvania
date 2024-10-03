import { GameBaseProps } from "../../GameBase"
import { CallEndGame, GameState, MapScale, PadsPurchaseMaxDistance, PurchaseSpeed, WinScore } from "../../logic"
import { PlayerData, PlayerInfo, PlayerTeam } from "./Player"
import { VectorHelp } from "../../VectorHelp"

export type PurchaseSensorInfo = {
    id: number,
    position: number[]
    cost: number,
    paid: number,
    score: number,
    playerTeam: PlayerTeam,
    enables: number[] //ids de objeto do Tiled
    visible: boolean,
    minLevel: number,
    playerOver: boolean,
    purchaseSpeed: number
}

export type PurchaseSensorData = {
    info: PurchaseSensorInfo
    costLabel: Phaser.GameObjects.Text | undefined,
    lockSprite: Phaser.GameObjects.Sprite | undefined,
    phaserScene: Phaser.Scene,
    game: GameBaseProps,
    graphics: Phaser.GameObjects.Graphics | undefined,
    sprite: Phaser.GameObjects.Sprite | undefined,
    tweenScale: Phaser.Tweens.Tween | undefined,
    tweenFade: Phaser.Tweens.Tween | undefined,
    particle: Phaser.GameObjects.Particles.ParticleEmitter | undefined,
    lastVisibleState: boolean,
    audioVolumeFade: number,
    spendAudio: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound,
    getPosition: () => number[],
}

export class PurchaseSensorMethods{

    public static construct(game: GameBaseProps, phaserScene: Phaser.Scene, info: PurchaseSensorInfo, soundManager: Phaser.Sound.WebAudioSoundManager){

        let color = 0xffffff
        if(info.playerTeam == 0) color = 0xeb1cbe;
        if(info.playerTeam == 1) color = 0x0000aa;
        if(info.playerTeam == 2) color = 0x05e4a8;
        if(info.playerTeam == 3) color = 0xffaa00;

        const data: PurchaseSensorData = {
            info: info,
            costLabel: phaserScene.add.text(0, 0, "Cost: 0\nPaid: 0", { font: '150px Alagard', align: "center" }),
            lockSprite: phaserScene.add.sprite(info.position[0], info.position[1], "LockIcon"),
            phaserScene: phaserScene,
            game: game,
            graphics:phaserScene.add.graphics({ lineStyle: { width: 10, color: color }}),
            tweenScale: undefined,
            tweenFade: undefined,
            sprite: phaserScene.add.sprite(info.position[0], info.position[1], "Purchase1"),
            particle: undefined,
            getPosition: () => [0, 0],
            spendAudio: soundManager.add("bloodSpend"),
            audioVolumeFade: 0,
            lastVisibleState: info.visible
        }


        data.tweenScale = phaserScene.tweens.add({
            targets: data.sprite,
            ease: "back.out",
            scale: MapScale,
            duration: 400,
            paused: true,
            repeat: 0,
            persist: true,
            onUpdate: () => {
            }
        })

        data.tweenFade = phaserScene.tweens.add({
            targets: data.sprite,
            ease: "back.out",
            alpha: 0,
            duration: 400,
            paused: true,
            repeat: 0,
            persist: true,
            onUpdate: () => {
            }
        })

        data.sprite.tint = color;
        data.sprite.scale = info.visible ? MapScale : 0
        data.sprite.alpha = 1

        data.lockSprite.setScale(MapScale * 0.6);
        data.lockSprite.setOrigin(0.5, 0.5);

        data.particle = phaserScene.add.particles(0, 0, 'Blood', {
            scale: { start: 0.70, end: 0, ease: 'sine.out' },
            x: { min: -data.sprite.width/2 + 20, max: data.sprite.width/2 - 20 },
            y: {min: -data.sprite.height + 20, max: -20},
            moveToX: {
                onEmit: () => {
                    if(!data.particle) return 0;
                    return (data.getPosition()[0] - data.particle.x) / MapScale;
                },
                onUpdate: () => {
                    if(!data.particle) return 0;
                    return (data.getPosition()[0] - data.particle.x) / MapScale;
                }
            },
            moveToY: {
                onEmit: () => {
                    if(!data.particle) return 0;
                    return (data.getPosition()[1] - data.particle.y) / MapScale;
                },
                onUpdate: () => {
                    if(!data.particle) return 0;
                    return (data.getPosition()[1] - data.particle.y) / MapScale;
                }
            },
            lifespan: 500,
            sortProperty: 'lifeT',
            sortOrderAsc: true,
            quantity: 1,
            frequency: 30,
            emitting: false
        });

        data.particle.scale = MapScale;

        return data;
    }

    public static update(self: PurchaseSensorData, game: GameBaseProps){
        if(self == undefined) return [];

        //let time = window.performance.now();
        const timestamps = [];

        //Calculate position
        const playerOwner: PlayerData = game.ingamePlayersList.find(p => p.playerInfo.playerTeam == self.info.playerTeam)
        let playerPos = [0, 0];
        if(playerOwner){
            const body = game.game.world.bodies[playerOwner.playerInfo.bodyId];
            if(body)
                playerPos = body.position;
            
            self.particle.depth = playerOwner.playerSprite.depth + 1;
        }
        self.getPosition = () => self.info.position;

        // timestamps.push({ name: "Calculate Position", time: window.performance.now() - time});
        // time = window.performance.now();

        //Update Positions

        self.costLabel?.setPosition(
            self.info.position[0] - self.costLabel.width/2,
            self.info.position[1] + 300
        )

        self.lockSprite?.setPosition(
            self.info.position[0] - self.costLabel.width/2 - 90,
            self.info.position[1] + 520
        )

        self.sprite.setPosition(self.info.position[0], self.info.position[1]);
        self.particle.setPosition(playerPos[0], playerPos[1]);

        // timestamps.push({ name: "Update Position", time: window.performance.now() - time});
        // time = window.performance.now();

        //Cost Label update
        let locked: string = "NO PLAYER";
        let hasPlayer: boolean = false;

        if(playerOwner){
            hasPlayer = true;
            locked = (playerOwner.playerInfo.rankingScore < self.info.minLevel) ?  "" + playerOwner.playerInfo.rankingScore + "/" + self.info.minLevel :  "";
        }

        self.costLabel?.setText(Math.floor(self.info.paid) + "/" + self.info.cost + "\n" + locked);
        self.costLabel.setVisible(hasPlayer ? self.info.visible : false);

        self.lockSprite?.setVisible(hasPlayer && playerOwner.playerInfo.rankingScore < self.info.minLevel ? self.info.visible : false);

        // timestamps.push({ name: "Cost Label Update", time: window.performance.now() - time});
        // time = window.performance.now();

        //Particles Update
        self.particle.visible = self.info.visible;
        self.particle.emitting = self.info.playerOver;

        // timestamps.push({ name: "Particles Update", time: window.performance.now() - time});
        // time = window.performance.now();

        //Audio Volume Fade

        if(self.info.playerOver){
            self.audioVolumeFade += (0.3 - self.audioVolumeFade) / 10;
        }
        else{
            self.audioVolumeFade += (0 - self.audioVolumeFade) / 10;
        }

        // timestamps.push({ name: "Audio Volume Fade", time: window.performance.now() - time});
        // time = window.performance.now();

        //Spatial volume
        const magnitude = VectorHelp.magnitude;

        const audioDistance = 
            magnitude([
                self.sprite.x - self.phaserScene.cameras.main.scrollX,
                self.sprite.y - self.phaserScene.cameras.main.scrollY
            ]) / 1000.0

        const vol = Math.min(1, (1 / (audioDistance*audioDistance)));

        // timestamps.push({ name: "Spatial Volume", time: window.performance.now() - time});
        // time = window.performance.now();

        //Loop play

        if(!self.phaserScene.sound.locked && !self.spendAudio.isPlaying){
            self.spendAudio.volume = (self.audioVolumeFade * vol * 2);
            self.spendAudio.play();
        }

        // timestamps.push({ name: "Audio Loop Play", time: window.performance.now() - time});
        // time = window.performance.now();

        //Visible sync
        self.lastVisibleState = self.info.visible;

        return timestamps;
    }

    public static reset(self: PurchaseSensorData, visible: boolean){
        self.sprite.scale = visible ? MapScale : 0;
        self.sprite.alpha = 1
        self.costLabel.setVisible(visible);
    }

    public static serverUpdate(self: PurchaseSensorInfo, game: GameState){
        if(self == undefined) return;
        if(!self.visible) return;
        
        //Procura os players próximos
        const playerOwner: PlayerInfo = game.playersList.find(p => p.playerTeam == self.playerTeam)
        if(!playerOwner) return;
        if(playerOwner.rankingScore < self.minLevel) return;

        const dist_f = VectorHelp.distanceFrom;

        const body = game.world.bodies[playerOwner.bodyId];
        const dist = dist_f(body.position, self.position);

        self.playerOver = false;

        if(dist < PadsPurchaseMaxDistance){

            const price =  1/30 * PurchaseSpeed * self.purchaseSpeed;

            //Tá em cima
            if(self.paid < self.cost && playerOwner.bloodCount > price){
                self.playerOver = true;
                self.paid += price;
                playerOwner.bloodCount -= price;
                self.purchaseSpeed += 5/30.0;

                //if(playerOwner.bloodCount < 0) playerOwner.bloodCount = 0;

                if(self.paid > self.cost){
                    self.paid = self.cost;
                    //Single event buy

                    if(playerOwner.purchased.find(i => i == self.id) == undefined){
                        playerOwner.rankingScore += self.score;

                        playerOwner.purchased.push(self.id);

                        if (playerOwner.rankingScore >= WinScore)
                            CallEndGame(game)
                    }

                    self.visible = false;//Me desliga
                    self.playerOver = false;

                    self.enables.forEach(id => { //Liga todos os objetos no "enables"
                        const obj = game.purchaseSensors[id]; //Procura no purchaseSensors
                        if(obj){
                            obj.visible = true;
                        }

                        const deco = game.decorations[id];
                        if(deco){
                            deco.visible = true;
                        }
                        //Procura em outras listas q esse objeto pode estar

                        //TUDO QUE FOR COLOCADO AQUI, TBM TEM Q SER DESFEITO EM PLAYER.TSX PLAYERMETHODS.DESTROYSERVER()
                    });
                }
            }
        }
        else{
            self.purchaseSpeed = 1;
        }

    }

}