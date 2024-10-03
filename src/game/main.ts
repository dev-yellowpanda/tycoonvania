import { Boot } from './scenes/Boot';
import { Main } from './scenes/Main';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { Pause } from './scenes/Pause';
import { HUD } from './scenes/HUD';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 1080,
    height: 1920,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    parent: 'game-container',
    backgroundColor: '#2a2a2a',
    scene: [
        Boot,
        Preloader,
        Main,
        Pause,
        HUD
    ],
    audio: {
        disableWebAudio: false
    }
};

export const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}
