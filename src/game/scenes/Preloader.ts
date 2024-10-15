import { Scene } from 'phaser';
import tiledMap from "../../../public/assets/maps/NewMap.json";
//import tiledMap from "../../maps/NewMap.json";

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        //  We loaded this image in our Boot Scene, so we can display it here
        // this.add.image(512, 384, 'background');

        //  A simple progress bar. This is the outline of the bar.
        // this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

        //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
        // const bar = this.add.rectangle(512-230, 384, 4, 28, 0xffffff);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        // this.load.on('progress', (progress: number) => {

            //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
            // bar.width = 4 + (460 * progress);

        // });
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets
        this.load.setPath('assets');

        this.load.image('tutArrow', 'arrow.png');
        this.load.image('villager', 'Villager.png');
        this.load.image("Purchase1", 'BuyButon1tile.png');

        this.load.image("playButton", 'playButton.png');

        this.load.image("BloodIcon", "icon_blood.png");
        this.load.image("ClockIcon", "icon_clock.png");
        this.load.image("LockIcon", "icon_locker.png");

        //AUDIOS
        this.load.audio('background', 'audios/background.mp3');
        this.load.audio('bloodGain', 'audios/bloodGain.mp3');
        this.load.audio('bloodSpend', 'audios/bloodSpend.mp3');
        this.load.audio('buildingRoom', 'audios/buildingRoom.mp3');
        this.load.audio('dismissPurchasePlatform', 'audios/dismissPurchasePlatform.mp3');
        this.load.audio('levelUp', 'audios/levelUp.mp3');
        this.load.audio('noBlood', 'audios/noBlood.mp3');
        this.load.audio('steps', 'audios/steps.mp3');
        this.load.audio('uiButton', 'audios/uiButton.mp3');

        //Tilemap
        this.load.image("TX Tileset Grass", "maps/TX Tileset Grass.png");
        this.load.image("TX Tileset Stone Ground", "maps/TX Tileset Stone Ground.png");
        this.load.image("TX Tileset Wall", "maps/TX Tileset Wall.png");

        this.load.image("TX Props", "maps/TX Props.png");
        this.load.image("TX Struct", "maps/TX Struct.png");

        tiledMap.tilesets.find(t => t.name == "Decoration").tiles.forEach(tile => {
            const imageName = tile.image.replaceAll("../decoration/", "").replaceAll(".png", "");
            this.load.image(imageName, "decoration/" + imageName + ".png");
        });

        this.load.tilemapTiledJSON("Map", "maps/NewMap.json")

        //Player Animations
        this.load.spritesheet('Red_Idle', 'player/Idle_Red.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('Red_Walk', 'player/WalkAnim_Red.png', { frameWidth: 32, frameHeight: 32 });

        this.load.spritesheet('Blue_Idle', 'player/Idle_Blue.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('Blue_Walk', 'player/WalkAnim_Blue.png', { frameWidth: 32, frameHeight: 32 });

        this.load.spritesheet('Green_Idle', 'player/Idle_Green.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('Green_Walk', 'player/WalkAnim_Green.png', { frameWidth: 32, frameHeight: 32 });

        this.load.spritesheet('Yellow_Idle', 'player/Idle_Yellow.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('Yellow_Walk', 'player/WalkAnim_Yellow.png', { frameWidth: 32, frameHeight: 32 });

        //Villager Animations

        this.load.spritesheet('Villager_Idle', 'AldeaoIdle.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('Villager_Walk', 'AldeaoWalk.png', { frameWidth: 32, frameHeight: 32 });

        //Particle

        this.load.image("Blood", "Blood.png");
        this.load.image("Plus1", "plus1.png");

        this.load.bitmapFont("Plus1", "plus1.png");
    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
