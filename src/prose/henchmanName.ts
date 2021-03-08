import RNG from "../RNG";

const adjs: string[] = [
  "Sleepy",
  "Snotty",
  "Sleazy",
  "Bent",
  "Twisted",
  "Tough",
  "Little",
  "Big",
  "Fraidy",
  "Boogie",
  "Sneezin’",
  "Flatulent",
  "Lazy",
  "Cheatin’",
  "Belchin’",
  "Wind-up",
  "Yammerin’",
  "Killer",
  "Scumbag",
];

const names: string[] = [
  "Joe",
  "Sam",
  "Marcus",
  "Alf",
  "Fred",
  "Ted",
  "Bill",
  "Will",
  "Biff",
  "Samuel",
  "Jim",
  "James",
  "Steve",
  "Marv",
  "Pete",
  "Stu",
  "Jeff",
  "Judd",
  "Dave",
  "Mike",
  "Mikey",
];

export default function getHenchmanName(): string {
  const rng = new RNG(`${Math.random()}`);
  return `${rng.choice(adjs)} ${rng.choice(names)}`;
}
