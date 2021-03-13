export interface Difficulty {
  numThugs: 0 | [number, number];
  numArmoredThugs: 0 | [number, number];
  numTitanThugs: 0 | [number, number];
  mapgenAlgo: "basic" | "prefab1";
  numGuns: [number, number] | 0;
  isBoss?: boolean;
  winCondition?: "boss";
  hasPits?: boolean;
}

export const DIFFICULTIES: Difficulty[] = [
  // {
  //   numThugs: [1, 1],
  //   numArmoredThugs: 0,
  //   numTitanThugs: 0,
  //   mapgenAlgo: "basic",
  //   numGuns: [1, 1],
  // },
  {
    numThugs: [3, 5],
    numArmoredThugs: 0,
    numTitanThugs: 0,
    mapgenAlgo: "basic",
    numGuns: 0,
  },
  {
    numThugs: [7, 10],
    numArmoredThugs: 0,
    numTitanThugs: 0,
    mapgenAlgo: "basic",
    numGuns: 0,
  },
  {
    numThugs: [2, 5],
    numArmoredThugs: [1, 3],
    numTitanThugs: 0,
    mapgenAlgo: "basic",
    numGuns: [1, 1],
  },
  {
    numThugs: [2, 5],
    numArmoredThugs: [2, 4],
    numTitanThugs: [0, 0],
    mapgenAlgo: "basic",
    hasPits: true,
    numGuns: [1, 2],
  },
  {
    numThugs: [2, 5],
    numArmoredThugs: [1, 3],
    numTitanThugs: [1, 2],
    mapgenAlgo: "basic",
    hasPits: true,
    numGuns: [1, 2],
  },
  {
    numThugs: 0,
    numArmoredThugs: 0,
    numTitanThugs: [4, 6],
    mapgenAlgo: "basic",
    numGuns: 0,
  },
  {
    isBoss: true,
    numThugs: [2, 2],
    numArmoredThugs: 0,
    numTitanThugs: 0,
    numGuns: 0,
    mapgenAlgo: "prefab1",
    winCondition: "boss",
  },
];
