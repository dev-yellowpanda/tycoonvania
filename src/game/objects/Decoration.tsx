import { GameState, MapScale } from "../../logic"
import { WorldMethods } from "../../physics/World"

export type DecorationInfo = {
    id: number,
    position: number[],
    sprite: string,
    visible: boolean,
    bodyId: string,
    height: number,
    bloodPerMinute: number
}

export type DecorationData = {
    info: DecorationInfo
    sprite: Phaser.GameObjects.Sprite | undefined,
    lastVisibleState: boolean,
    tween: Phaser.Tweens.Tween | undefined,
    particle: Phaser.GameObjects.Particles.ParticleEmitter | undefined,
    phaserScene: Phaser.Scene | undefined
}

export class DecorationMethods {

    public static construct(phaserScene: Phaser.Scene, info: DecorationInfo){

        const decoration: DecorationData = {
            info: info,
            sprite: undefined,
            lastVisibleState: info.visible,
            tween: undefined,
            particle: undefined,
            phaserScene: phaserScene
        };

        decoration.sprite = phaserScene.add.sprite(info.position[0], info.position[1], info.sprite);
        decoration.sprite.setScale(info.visible ? MapScale : 0);
        decoration.sprite.setOrigin(0.5, 1)
        decoration.sprite.depth = info.position[1] + decoration.info.height;


        decoration.tween = phaserScene.tweens.add({
            targets: decoration.sprite,
            ease: "back.out",
            scale: MapScale,
            duration: 400,
            paused: true,
            repeat: 0,
            persist: true,
            onUpdate: () => {
            }
        })

        //CHAMAR AUDIO DANDO SANGUE AO PLAYER

        const mpb = (1 / info.bloodPerMinute) * 60 * 1000;

        decoration.particle = phaserScene.add.particles(info.position[0], info.position[1] - (decoration.sprite.height / 2) * MapScale, 'Plus1', {
            scale: { start: 1, end: 0, ease: 'cubic.in' },
            alpha: { values: [0, 1, 0], interpolation: 'linear'},
            lifespan: 750,
            angle: -90,
            speed: 30,
            sortProperty: 'lifeT',
            sortOrderAsc: true,
            quantity: 1,
            frequency: mpb,
            emitting: true
        });

        decoration.particle.scale = MapScale;


        return decoration;
    }

    public static resetInfo(data: DecorationData, info: DecorationInfo){
        data.sprite = data.phaserScene.add.sprite(info.position[0], info.position[1], info.sprite);
        data.sprite.setScale(info.visible ? MapScale : 0);
        data.sprite.setOrigin(0.5, 1)
        data.sprite.depth = info.position[1] + info.height;
    }

    public static update(self: DecorationData){
        if(!self) return;

        //self.sprite.visible = self.info.visible;
        
        if(self.lastVisibleState != self.info.visible){
            if(self.info.visible){ //Acabou de ligar
                console.log("Decoration acabou de ligar");
                self.tween.seek(0);
                self.tween.play();
            }
            else{ //Acabou de desligar
                console.log("Decoration acabou de desligar");
            }
        }

        self.particle.depth = self.sprite.depth + 1;
        self.particle.visible = self.info.visible;
        self.particle.emitting = self.info.visible;

        self.lastVisibleState = self.info.visible;
    }

    public static reset(self: DecorationData, visible: boolean){
        self.sprite.setScale(visible ? MapScale : 0);
    }

    public static serverUpdate(game: GameState, self: DecorationInfo){
        if(self.bodyId){
            game.world.bodies[self.bodyId].active = self.visible;
        }
    }

    public static destroy(self: DecorationData, game: GameState){
        if(!self) return;

        WorldMethods.RemoveBody(self.info.bodyId, game.world);

        self.particle.destroy();
        self.sprite.destroy();

    }
}