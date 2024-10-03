
import { GameState, MapScale, VillagerBloodStorage, VillagerCooldown, VillagerDrainTime } from "../../logic";
import { VectorHelp } from "../../VectorHelp";
import { AudioPlayerMethods } from "./AudioPlayer";
import { PlayerInfo, PlayerTeam } from "./Player";

//Veja Player.tsx

export type VillagerInfo = {
    villagerID: string,
    position: number[],
    origin: number[],
    bloodCount: number,
    cooldown: number,
    playersInRange: string[]
    path: number[]
    currentPathIndex: number,
    moving: boolean,
    direction: number,
    speed: number
}

export type VillagerData = {

    data: VillagerInfo,
    phaserScene: Phaser.Scene,
    sprite: Phaser.GameObjects.Sprite | undefined,
    bloodIcon: Phaser.GameObjects.Sprite | undefined,
    bloodLabel: Phaser.GameObjects.Text | undefined,
    cooldownIcon: Phaser.GameObjects.Sprite | undefined,
    cooldownLabel: Phaser.GameObjects.Text | undefined,
    spriteFX: Phaser.FX.ColorMatrix | undefined,
    particles: { [id: number] : Phaser.GameObjects.Particles.ParticleEmitter | undefined },
    graphics: Phaser.GameObjects.Graphics | undefined,
    getPlayerPos: (playerTeam: PlayerTeam) => number[],
    cooldownLastFrame: number,
    bloodAudio: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound,
    audioVolumeFade: number,
    currentAnimation: string
}

export class VillagerMethods{

    
    public static construct(data: VillagerInfo, phaserScene: Phaser.Scene){
        const villager: VillagerData = {
            data: data,
            phaserScene: phaserScene,
            sprite: undefined,
            bloodIcon: undefined,
            bloodLabel: undefined,
            cooldownIcon: undefined,
            cooldownLabel: undefined,
            spriteFX: undefined,
            graphics:phaserScene.add.graphics({ lineStyle: { width: 10, color: 0xffffff }}),
            particles: {},
            getPlayerPos: () => [0, 0],
            cooldownLastFrame: data.cooldown,
            bloodAudio: phaserScene.sound.add("bloodGain"),
            audioVolumeFade: 0,
            currentAnimation: "Villager_Idle"
        };

        phaserScene.anims.create({
            key: "Villager_Idle",
            frames: phaserScene.anims.generateFrameNumbers("Villager_Idle", { frames: [0, 1, 2, 3, 4] }),
            frameRate: 10,
            repeat: -1
        })

        phaserScene.anims.create({
            key: "Villager_Walk",
            frames: phaserScene.anims.generateFrameNumbers("Villager_Walk", { frames: [0, 1, 2, 3, 4] }),
            frameRate: 10,
            repeat: -1
        })

        villager.sprite = phaserScene.add.sprite(data.position[0], data.position[1], "Villager_Idle");
        villager.sprite.setScale(MapScale);
        villager.sprite.setOrigin(0.5, 1);
        villager.spriteFX = villager.sprite.preFX?.addColorMatrix();
        
        villager.sprite.play("Villager_Idle");
        
        villager.bloodIcon = phaserScene.add.sprite(data.position[0], data.position[1], "BloodIcon");
        villager.bloodIcon.setScale(MapScale * 0.6);
        villager.bloodIcon.setOrigin(0.5, 0.5);
        villager.bloodLabel = phaserScene.add.text(data.position[0], data.position[1], "100", { font: '135px Alagard' });
        villager.cooldownIcon = phaserScene.add.sprite(data.position[0], data.position[1], "ClockIcon");
        villager.cooldownIcon.setScale(MapScale * 0.6);
        villager.cooldownIcon.setOrigin(0.5, 0.5);
        villager.cooldownLabel = phaserScene.add.text(data.position[0], data.position[1], "100", { font: '135px Alagard' });
        
        for(let i = 0; i < 4; i ++){
            villager.particles[i] = phaserScene.add.particles(data.position[0], data.position[1], 'Blood', {
                scale: { start: 0.70, end: 0, ease: 'sine.out' },
                x: { min: -villager.sprite.width/2 + 20, max: villager.sprite.width/2 - 20 },
                y: {min: -villager.sprite.height + 20, max: -20},
                moveToX: {
                    onEmit: () => {
                        if(!villager.particles[i]) return 0;
                        return (villager.getPlayerPos(i)[0] - villager.particles[i].x) / MapScale;
                    },
                    onUpdate: () => {
                        if(!villager.particles[i]) return 0;
                        return (villager.getPlayerPos(i)[0] - villager.particles[i].x) / MapScale;
                    }
                },
                moveToY: {
                    onEmit: () => {
                        if(!villager.particles[i]) return 0;
                        return (villager.getPlayerPos(i)[1] - villager.particles[i].y) / MapScale;
                    },
                    onUpdate: () => {
                        if(!villager.particles[i]) return 0;
                        return (villager.getPlayerPos(i)[1] - villager.particles[i].y) / MapScale;
                    }
                },
                lifespan: 500,
                sortProperty: 'lifeT',
                sortOrderAsc: true,
                quantity: 1,
                frequency: 30
            });
    
            villager.particles[i].scale = MapScale;
        }

        return villager;
    }

    public static updateSpritePosition(game: GameState, self: VillagerData){
        if(!self) return;

        const playerPosition: number[] = self.data.position;

        self.sprite?.setPosition(
            playerPosition[0],
            playerPosition[1]
        )
        self.sprite.depth = playerPosition[1];

        self.bloodIcon?.setPosition(
            playerPosition[0] - 110,
            playerPosition[1] + 60
        )
        self.bloodIcon.depth = playerPosition[1];

        self.bloodLabel?.setPosition(
            playerPosition[0],
            playerPosition[1] + 10
        )
        // self.bloodLabel?.setText("Blood: " + Math.round(self.data.bloodCount) + "\n" + self.data.playersInRange.join(", "));
        self.bloodLabel?.setText("" + Math.round(self.data.bloodCount));
        self.bloodLabel!.depth = self.sprite!.depth + 1;

        self.cooldownIcon?.setPosition(
            playerPosition[0] - 110,
            playerPosition[1] + 260
        )
        self.cooldownIcon.depth = playerPosition[1];

        self.cooldownLabel?.setPosition(
            playerPosition[0],
            playerPosition[1] + 200
        )
        self.cooldownLabel?.setText("" + Math.round(self.data.cooldown));
        self.cooldownLabel!.depth = self.sprite!.depth + 1;

        for(const key in self.particles){
            self.particles[key].depth = self.sprite.depth + 1;
        }

        self.getPlayerPos = (playerTeam: PlayerTeam) => {
            const player = game.playersList.find(p => p.playerTeam == playerTeam);

            if(player){
                
                const body = game.world.bodies[player.bodyId];

                return [
                    body.position[0],
                    body.position[1]
                ]
            }
            return [0, 0];
        }


        for(let i = 0; i < 4; i ++){ //Loopa pelos 4 times
            
            const player = game.playersList.find(p => p.playerTeam == i);

            self.particles[i].setPosition(self.sprite.x, self.sprite.y);

            if(player){

                if(self.data.playersInRange.find(p => p == player.playerId) !== undefined){
                    self.particles[i].emitting = self.data.bloodCount > 0;
                }
                else{ //Esse player não tá in range
                    self.particles[i].emitting = false;
                }

            }
            else{ //Player desse time não existe no jogo
                self.particles[i].emitting = false;
            }
        }

    }

    public static update(game: GameState, self: VillagerData){
        if(!self) return;

        VillagerMethods.updateSpritePosition(game, self);

        self.graphics.clear();
        self.graphics.strokeCircle(self.data.position[0], self.data.position[1], 500);
 
        if(self.data.cooldown > 0){
            self.spriteFX?.blackWhite();
        }
        else{
            self.spriteFX?.reset();
        }

        if (self.data.moving && self.currentAnimation == "Villager_Idle") {
            self.currentAnimation = "Villager_Walk";
            self.sprite.play(self.currentAnimation);
        }

        if (!self.data.moving && self.currentAnimation == "Villager_Walk") {
            self.currentAnimation = "Villager_Idle";
            self.sprite.play(self.currentAnimation);
        }

        self.sprite.scaleX = self.data.direction * MapScale;

        if(self.data.playersInRange.length > 0 && self.data.cooldown <= 0){
            self.audioVolumeFade += (0.3 - self.audioVolumeFade) / 10;
        }
        else{
            self.audioVolumeFade += (0 - self.audioVolumeFade) / 10;
        }

        const magnitude = VectorHelp.magnitude;

        const audioDistance = 
            magnitude([
                self.sprite.x - self.phaserScene.cameras.main.scrollX,
                self.sprite.y - self.phaserScene.cameras.main.scrollY
            ]) / 1000.0


        const vol = Math.min(1, (1 / (audioDistance*audioDistance)));

        const volFinal = Math.max(Math.min(1, self.audioVolumeFade * vol * 2), 0);

        if(Number.isFinite(volFinal)){
            self.bloodAudio.setVolume(volFinal);
        }

        if(!self.phaserScene.sound.locked && !self.bloodAudio.isPlaying){
            self.bloodAudio.play();
        }

        if(self.cooldownLastFrame <= 0 && self.data.cooldown > 0){
            //CHAMAR AUDIO PRETO E BRANCO
            AudioPlayerMethods.playSFX(self.phaserScene, 'levelUp', 0.3)
        }

        self.cooldownLastFrame = self.data.cooldown
    }

    public static serverUpdate(game: GameState, villager: VillagerInfo){

        // let canMove: boolean = true;
        // villager.moving = true;

        villager.playersInRange.forEach(playerId => {
            const player: PlayerInfo | undefined = game.playersList.find(player => player.playerId == playerId);
            if(player){
                if(villager.bloodCount > 0){
                    const bloodDrop = 1/30 * VillagerBloodStorage / VillagerDrainTime;
                    villager.bloodCount -= bloodDrop;
                    player.bloodCount += bloodDrop;
                    villager.moving = false;
                }
            }
        });

        if(villager.playersInRange.length === 0){
            villager.moving = true;
        }

        if(villager.bloodCount <= 0){
            if(villager.cooldown < VillagerCooldown){
                villager.cooldown += 1/30;

                if(villager.cooldown >= VillagerCooldown){
                    villager.bloodCount = VillagerBloodStorage;
                    villager.cooldown = 0;
                }
            }

            villager.moving = true
        }

        const targetSpeed = villager.moving ? 1 : 4;
        villager.speed += (targetSpeed - villager.speed) / 10;

        //if(canMove){
            const sub = VectorHelp.subtract;
            const normalize = VectorHelp.normalize;
            //const add = VectorHelp.vectorSum;
            const ln = VectorHelp.magnitude;
            const sc = VectorHelp.scale;

            const targetPosition: number[] = 
                [
                    villager.path[villager.currentPathIndex * 2] + (villager.origin[0] * 1.01), //dusk desync hack, do not change 1.01
                    villager.path[villager.currentPathIndex * 2 + 1] + (villager.origin[1] * 1.01)
                ] 

            const direction: number[] = normalize(sub(targetPosition, villager.position));
            const scaledDir = sc(direction, 10);

            if(scaledDir[0] > 0) villager.direction = 1;
            if(scaledDir[0] < 0) villager.direction = -1;

            villager.position[0] += scaledDir[0] * targetSpeed;
            villager.position[1] += scaledDir[1] * targetSpeed;

            const distance = ln(sub(targetPosition, villager.position)); //Calcula a distancia pra mudar pro próximo ponto do path
            // villager.moving = true;

            if(distance < 50){
                villager.currentPathIndex ++;
                villager.currentPathIndex = villager.currentPathIndex % (villager.path.length / 2);
            }

        //}
    }
}