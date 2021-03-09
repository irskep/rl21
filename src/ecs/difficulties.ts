export interface Difficulty {
  numThugs: number;
  numArmoredThugs: number;
  numTitanThugs: number;
  mapgenAlgo: "basic";
}

export const DIFFICULTIES: Difficulty[] = [
  {
    numThugs: 3,
    numArmoredThugs: 0,
    numTitanThugs: 0,
    mapgenAlgo: "basic",
  },
  {
    numThugs: 10,
    numArmoredThugs: 0,
    numTitanThugs: 0,
    mapgenAlgo: "basic",
  },
  {
    numThugs: 5,
    numArmoredThugs: 1,
    numTitanThugs: 0,
    mapgenAlgo: "basic",
  },
  {
    numThugs: 5,
    numArmoredThugs: 3,
    numTitanThugs: 0,
    mapgenAlgo: "basic",
  },
  {
    numThugs: 5,
    numArmoredThugs: 0,
    numTitanThugs: 3,
    mapgenAlgo: "basic",
  },
  {
    numThugs: 0,
    numArmoredThugs: 3,
    numTitanThugs: 3,
    mapgenAlgo: "basic",
  },
];
