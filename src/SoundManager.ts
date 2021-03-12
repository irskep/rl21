import { Howl } from "howler";

const soundNames: string[] = [
  "blocked_punch",
  "bm_punched",
  "counter",
  "punch",
  "stun",
  "superpunch",
  "miss",
  "shoot",
];

const musicNames: string[] = [
  "dramatic_bg_theme_1_looped",
  "dramatic_bg_theme_3_looped",
  "rise_of_the_fallen_looped",
  "dramatic_pulsing_theme_2_looped",
  "dramatic_pulsing_theme_8_looped",
  "dramatic_pulsing_theme_9_looped",
];

export class SoundManager {
  soundList: Howl[] = [];
  sounds: Record<string, Howl> = {};
  musics: Howl[] = [];
  numLoaded = 0;

  musicTrack = 0;
  playingMusic?: Howl;

  onLoadSoundsComplete?: () => void;

  static shared = new SoundManager();

  init() {
    if (this.soundList.length) return;
    this.soundList = soundNames.map((name) => {
      const s = new Howl({
        src: `${name}.wav`,
        preload: true,
        html5: true,
        onload: this.onload,
      });
      s.volume(0.3);
      return s;
    });
    for (let i = 0; i < soundNames.length; i++) {
      this.sounds[soundNames[i]] = this.soundList[i];
    }

    this.musics = musicNames.map(
      (name) =>
        new Howl({
          src: `${name}.mp3`,
          loop: true,
          preload: false,
          html5: true,
        })
    );
  }

  play(name: string) {
    if (this.sounds[name]) {
      this.sounds[name].play();
    } else {
      console.warn("Missing sound:", name);
    }
  }

  onload = () => {
    this.numLoaded += 1;
    if (this.numLoaded === this.soundList.length && this.onLoadSoundsComplete)
      this.onLoadSoundsComplete();
  };

  playNextMusic() {
    if (localStorage.disableMusic) return;
    this.playingMusic?.stop();
    this.playingMusic = this.musics[this.musicTrack];
    this.musicTrack += 1;
    this.playingMusic.play();
    console.log(this.playingMusic);
  }

  stopMusic() {
    this.playingMusic?.stop();
    this.playingMusic = undefined;
  }
}
