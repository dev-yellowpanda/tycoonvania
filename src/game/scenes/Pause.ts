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

        const playBytton = this.add.sprite(this.sys.game.canvas.width / 2, this.sys.game.canvas.height / 2, 'playButton').setInteractive()
        playBytton.setScale(5)

        const textPaused = this.add.text(this.sys.game.canvas.width / 2, (this.sys.game.canvas.height / 2) - 300, data.checkFirstLoad() ? "Start" : "Paused", { font: '120px Alagard', align: "center" })
        textPaused.setOrigin(0.5, 0.5);

        playBytton.on('pointerdown', () => {
            data.onResume();
        });

        // this.input.on('pointerdown', () => {
        //     data.onResume();
        // });
    }

    update(): void {

        this.graphics.clear();
        this.graphics.fillRect(0, 0, this.sys.game.canvas.width, this.sys.game.canvas.height);

    }

}
