import { Injectable } from '@angular/core';

interface Sound {
    key: Sounds;
    asset: string;
    volume?: number;
}


export enum Sounds {
    CardDealt,
    CardsDealt,
    ChipsBet,
    Leave
}

@Injectable({
    providedIn: 'root'
})
export class AudioService {

    private sounds: Sound[] = [];
    private audioPlayer: HTMLAudioElement = new Audio();

    // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
    constructor() {

        this.preload(Sounds.CardDealt, 'assets/sounds/cardPlace1.wav');
        this.preload(Sounds.CardsDealt, 'assets/sounds/cardPlace2.wav');
        this.preload(Sounds.ChipsBet, 'assets/sounds/chipsHandle1.wav');
        this.preload(Sounds.Leave, 'assets/sounds/error.ogg', 0.8);
    }

    private preload(key: Sounds, asset: string, volume?: number): void {
        this.sounds.push({
            key,
            asset,
            volume
        });
    }

    play(key: Sounds): void {

        let soundToPlay = this.sounds.find(sound => sound.key === key);

        if (!soundToPlay) {
            throw new Error(`Could not find sound[${ key }]!`);
        }

        this.audioPlayer.src = soundToPlay.asset;
        this.audioPlayer.volume = soundToPlay.volume || 1;
        const playStarted = this.audioPlayer.play();

        if (playStarted !== undefined) {
            playStarted.then(_ => {
                // Autoplay started!
            }).catch(error => {
                // Autoplay was prevented.
                console.warn(`Autoplay of sound[${ key }] was prevented!`);
            });
        }

    }
}
