import * as PIXI from "pixi.js";

function frames(
  texture: PIXI.Texture,
  coordinates: [number, number][],
  frameWidth: number,
  frameHeight: number
): PIXI.Texture[] {
  const baseTexture = new PIXI.Texture(texture.baseTexture);
  const textures = coordinates.map((position) => {
    const x = position[0],
      y = position[1];
    const imageFrame = new PIXI.Rectangle(x, y, frameWidth, frameHeight);
    const frameTexture = new PIXI.Texture(baseTexture.baseTexture);
    frameTexture.frame = imageFrame;
    return frameTexture;
  });
  return textures;
}

export default function filmstrip(
  texture: PIXI.Texture,
  frameWidth: number,
  frameHeight: number,
  spacing = 0
) {
  //An array to store the x/y positions of the frames
  const positions: [number, number][] = [];

  //Find the width and height of the texture
  const textureWidth = texture.width,
    textureHeight = texture.height;

  //Find out how many columns and rows there are
  const columns = textureWidth / frameWidth,
    rows = textureHeight / frameHeight;

  //Find the total number of frames
  const numberOfFrames = columns * rows;

  for (let i = 0; i < numberOfFrames; i++) {
    //Find the correct row and column for each frame
    //and figure out its x and y position
    let x = (i % columns) * frameWidth,
      y = Math.floor(i / columns) * frameHeight;

    //Compensate for any optional spacing (padding) around the tiles if
    //there is any. This bit of code accumlates the spacing offsets from the
    //left side of the tileset and adds them to the current tile's position
    if (spacing > 0) {
      x += spacing + ((spacing * i) % columns);
      y += spacing + spacing * Math.floor(i / columns);
    }

    //Add the x and y value of each frame to the `positions` array
    positions.push([x, y]);
  }

  //Return the frames
  return frames(texture, positions, frameWidth, frameHeight);
}
