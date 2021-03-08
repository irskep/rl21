import seedrandom from "seedrandom";

export default class RNG {
  getRandom: () => number;

  constructor(seed: string) {
    this.getRandom = seedrandom(seed);
  }

  replaceMathRandom<T>(fn: () => T): T {
    const r = Math.random;
    Math.random = this.getRandom;
    const val = fn();
    Math.random = r;
    return val;
  }

  int(minInclusive: number, maxExclusive: number): number {
    return minInclusive + Math.floor(this.getRandom() * maxExclusive);
  }

  float(min: number, max: number): number {
    return min + this.getRandom() * (max - min);
  }

  choice<T>(items: Array<T>): T {
    return items[Math.floor(this.getRandom() * items.length)];
  }

  chooseAndRemove<T>(items: Array<T>): T {
    const ix = Math.floor(this.getRandom() * items.length);
    return items.splice(ix, 1)[0];
  }

  shuffled<T>(array: Array<T>): Array<T> {
    const arr = new Array<T>().concat(array);
    this.shuffle(arr);
    return arr;
  }

  shuffle<T>(array: Array<T>) {
    let currentIndex = array.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(this.getRandom() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  // Gives back N values between 0 and Math.PI * 2, where values are evenly
  // distributed but start at a random place
  getSlots(n: number): number[] {
    const slots = new Array<number>();
    let last = this.getRandom();
    for (let i = 0; i < n; i++) {
      if (last > Math.PI * 2) last -= Math.PI * 2;
      slots.push(last);
      last += (Math.PI * 2) / n;
    }
    return slots;
  }
}
