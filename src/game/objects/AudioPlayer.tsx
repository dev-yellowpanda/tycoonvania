// const sounds = {
//     "background": new Audio('assets/audios/background.mp3'),
//     "bloodGain":  new Audio('assets/audios/bloodGain.mp3'),
//     "bloodSpend": new Audio('assets/audios/bloodSpend.mp3'),
//     "buildingRoom": new Audio('assets/audios/buildingRoom.mp3'),
//     "dismissPurchasePlatform": new Audio('assets/audios/dismissPurchasePlatform.mp3'),
//     "levelUp": new Audio('assets/audios/levelUp.mp3'),
//     "noBlood": new Audio('assets/audios/noBlood.mp3'),
//     "steps": new Audio('assets/audios/steps.mp3'),
//     "uiButton": new Audio('assets/audios/uiButton.mp3')
// }

export class AudioPlayerMethods {


    // public static playBG(audioKey: string) {
    //     const bgAudio: HTMLAudioElement = sounds[audioKey];

    //     bgAudio.loop = true
    //     bgAudio.volume = 0.1;
    //     bgAudio.play()

    //     return bgAudio
    // }

    public static playSFX(phaserScene: Phaser.Scene, audioKey: string, volume: number = 1, loop: boolean = false) {
        //const audio: HTMLAudioElement = sounds[audioKey];
        const audio = phaserScene.sound.add(audioKey, {
            loop: loop,
            volume: volume
        });

        audio.on('complete', () => {
            audio.destroy();
        });

        audio.play();
        
        return audio;
    }

}