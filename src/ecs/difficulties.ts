export interface Difficulty {
  numThugs: 0 | [number, number];
  numArmoredThugs: 0 | [number, number];
  numTitanThugs: 0 | [number, number];
  mapgenAlgo: "basic";
  numGuns: [number, number] | 0;
}

export const DIFFICULTIES: Difficulty[] = [
  {
    // delete me
    numThugs: [2, 4],
    numArmoredThugs: 0,
    numTitanThugs: 0,
    mapgenAlgo: "basic",
    numGuns: [1, 1],
  },
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
    numGuns: [1, 2],
  },
  {
    numThugs: [2, 5],
    numArmoredThugs: [2, 4],
    numTitanThugs: [0, 1],
    mapgenAlgo: "basic",
    numGuns: [1, 2],
  },
  {
    numThugs: [2, 5],
    numArmoredThugs: [1, 3],
    numTitanThugs: [2, 3],
    mapgenAlgo: "basic",
    numGuns: [1, 2],
  },
  {
    numThugs: 0,
    numArmoredThugs: 0,
    numTitanThugs: [4, 6],
    mapgenAlgo: "basic",
    numGuns: 0,
  },
];
