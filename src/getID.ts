let nextID = 0;

export default function getID(): number {
  const id = nextID;
  nextID += 1;
  return id;
}
