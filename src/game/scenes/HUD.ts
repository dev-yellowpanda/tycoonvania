import { Scene } from 'phaser';

export class HUD extends Scene {

    // fpsLabel: Phaser.GameObjects.Text | undefined;

    constructor() {
        super('HUD');
    }

    create() {
        // this.fpsLabel = this.add.text(this.sys.game.canvas.width/2, 200, "FPS", { font: '45px Arial', align: "center" });
    }

    update(): void {
        // this.fpsLabel.setPosition(this.sys.game.canvas.width/2 - this.fpsLabel.width/2, 300);
        // this.fpsLabel.setText("FPS: " + this.game.loop.actualFps.toFixed(2));
    }

}
