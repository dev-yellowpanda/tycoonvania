import { Scene } from 'phaser';

export class Pause extends Scene {

    graphics: Phaser.GameObjects.Graphics;

    constructor() {
        super('Pause');
    }

    create(data) {

        this.graphics = this.add.graphics({
            fillStyle: {
                color: 0x000000,
                alpha: 0.5
            }
        })

        this.input.on('pointerdown', () => {
            data.onResume();
        });
    }

    update(): void {

        this.graphics.clear();
        this.graphics.fillRect(0, 0, this.sys.game.canvas.width, this.sys.game.canvas.height);
    }

}
