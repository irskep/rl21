export interface Difficulty {
  numThugs: number;
  numArmoredThugs: number;
  numTitanThugs: number;
  mapgenAlgo: "basic";
}

export const DIFFICULTIES: Difficulty[] = [
  // {
  //   numThugs: 0,
  //   numArmoredThugs: 1,
  //   numTitanThugs: 0,
  //   mapgenAlgo: "basic",
  // },
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
    numThugs: 4,
    numArmoredThugs: 1,
    numTitanThugs: 0,
    mapgenAlgo: "basic",
  },
  {
    numThugs: 4,
    numArmoredThugs: 3,
    numTitanThugs: 0,
    mapgenAlgo: "basic",
  },
  {
    numThugs: 4,
    numArmoredThugs: 0,
    numTitanThugs: 2,
    mapgenAlgo: "basic",
  },
  {
    numThugs: 3,
    numArmoredThugs: 1,
    numTitanThugs: 3,
    mapgenAlgo: "basic",
  },
  {
    numThugs: 0,
    numArmoredThugs: 2,
    numTitanThugs: 2,
    mapgenAlgo: "basic",
  },
];
