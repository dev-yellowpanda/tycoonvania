import { Scene } from 'phaser';

import { EventBus } from '../EventBus';
import { GameBaseProps } from '../../GameBase';
import { MapScale } from '../../logic';

export class Main extends Scene {

    backgroundAudio: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    props: GameBaseProps

    constructor() {
        super('MainMenu');
    }

    create() {
        
        this.sound.pauseOnBlur = false;

        this.game.events.on(Phaser.Core.Events.BLUR, () => {
            this.handleLoseFocus();
        });

        document.addEventListener('visibilitychange', () => {
            if(!document.hidden) return;
            this.handleLoseFocus();
        });

        this.backgroundAudio = this.sound.add("background");
        this.backgroundAudio.setVolume(0.3);
        this.backgroundAudio.setLoop(true);

        if(!this.sound.locked){
            this.backgroundAudio.play();
        }
        else{
            this.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
                this.backgroundAudio.play();
            });
        }

        const map = this.make.tilemap({ key: 'Map' });
        const grass = map.addTilesetImage('TX Tileset Grass', 'TX Tileset Grass');
        const stoneGround = map.addTilesetImage('TX Tileset Stone Ground', 'TX Tileset Stone Ground');
        const walls = map.addTilesetImage('TX Tileset Wall', 'TX Tileset Wall');
        const struct = map.addTilesetImage('TX Struct', 'TX Struct');
        const props = map.addTilesetImage('TX Props', 'TX Props');

        const backgroundLayer = map.createLayer('Background', [grass])
        backgroundLayer?.setScale(MapScale, MapScale);

        const floorLayer = map.createLayer('Floors', [stoneGround, struct, props, grass])
        floorLayer?.setScale(MapScale, MapScale);

        const wallsLayer = map.createLayer('Walls', [walls])
        wallsLayer?.setScale(MapScale, MapScale);

        const wallToppersLayer = map.createLayer('WallToppers', [walls])
        wallToppersLayer?.setScale(MapScale, MapScale);

        this.scene.launch("HUD");
        
        EventBus.emit('current-scene-ready', this);
    }

    handleLoseFocus(){
        if(this.scene.isActive("Pause")) return;

        console.log("handleLoseFocus(), pausing all audios playing");
        
        const paused: Phaser.Sound.BaseSound[] = this.sound.getAllPlaying();
        paused.forEach(sound => {
            sound.pause();
        });

        this.scene.pause("MainMenu")
        const lastInputBlock = this.props ? this.props.blockClientInputs : false;
        if(this.props) this.props.setBlockClientInputs(true);
        this.scene.launch("Pause", {
            onResume: () => {
                console.log("Resuming from Pause");
                this.scene.stop("Pause");
                this.scene.resume("MainMenu");
                this.props.setBlockClientInputs(lastInputBlock);
                paused.forEach(sound => {
                    sound.resume();
                });
            }
        })

    }

    update(): void {
        
        EventBus.on('scene-game-props', (props: GameBaseProps) => {
            this.props = props;
        });

        EventBus.emit('update-phaser-method', this);
    }

}
