/*
Copyright (c) 2016, Mykola Musiienko
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
class Line {
  private _isSlopeNormalized = false;

  private _dx: number;
  private _dy: number;

  constructor(
    public x0: number,
    public y0: number,
    public x1: number,
    public y1: number
  ) {
    // It's important to call normalizeSlope() before normalize()
    // as normalizeSlope can swap the coordinates of line's endpoints
    // and this swapping can result in a "denormalization" of the line.
    this.normalizeSlope();
    this.normalize();

    this._dy = this.y1 - this.y0;
    this._dx = this.x1 - this.x0;
  }

  private normalize() {
    if (this.x0 > this.x1) {
      let temp = this.x0;
      this.x0 = this.x1;
      this.x1 = temp;

      temp = this.y0;
      this.y0 = this.y1;
      this.y1 = temp;
    }
  }

  private normalizeSlope() {
    this._isSlopeNormalized = false;

    // The slope of a line is considered to be steep when its value is greater than 1
    // The slope calculation formulae is the following:
    // slope = dy / dx
    // In case dy is greater than dx, the slope is greater than 1 (steep)
    const dx = Math.abs(this.x1 - this.x0);
    const dy = Math.abs(this.y1 - this.y0);

    const isSteep = dy > dx;
    if (isSteep) {
      // So, the slope is steep.
      // We swap x0 <=> y0, x1 <=> y0.
      // As a result, we "mirror" the line over the straight line
      // going through the centre of coordinates at 45 degree angle.
      // And so the slope of this "mirrored" line is not steep anymore.
      // (The line is symmetrical to the original wrt the 45 degree straight line.)
      let temp = this.x0;
      this.x0 = this.y0;
      this.y0 = temp;

      temp = this.x1;
      this.x1 = this.y1;
      this.y1 = temp;

      this._isSlopeNormalized = true;
    }
  }

  public get isSlopeNormalized(): boolean {
    return this._isSlopeNormalized;
  }

  public get dy(): number {
    return this._dy;
  }

  public get dx(): number {
    return this._dx;
  }
}

/// <remarks>
/// See <a href="https://www.cs.helsinki.fi/group/goa/mallinnus/lines/bresenh.html">The Bresenham Line-Drawing Algorithm</a>
/// for the reference...
/// </remarks>
export class BresenhamRasterizer {
  private line: Line;

  private readonly stepOfY: number;
  private readonly stepOfEpsilon: number;

  constructor(
    private fillCellCallback: (x: number, y: number) => any,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ) {
    this.line = new Line(x0, y0, x1, y1);

    // We use absolute value of line.dy (stepOfEpsilon) only as the increment of epsilon.
    // This lets us figure out when it's time to change y.
    // y is changed by stepOfY which can be either +1 or -1
    // depending on the original sign of line.dy.
    if (this.line.dy > 0) {
      this.stepOfY = 1;
      this.stepOfEpsilon = this.line.dy;
    } else {
      this.stepOfY = -1;
      this.stepOfEpsilon = -this.line.dy;
    }
  }

  public rasterizeLine() {
    // A horizontal line is rasterized just fine:
    // dy is zero and consequently y is never changed,
    // so the resulting rasterization is horizontal.

    // A vertical line is rasterized successfully thanks to the following:
    // 1. A vertical line is considered to have a steep slope and
    //    and as a result it's normalized to a "horizontal" line.
    // 2. A horizontal line rasterization is described above...

    let epsilon = 0;

    let x = this.line.x0;
    let y = this.line.y0;

    do {
      this.fillCell(x, y);

      x = x + 1;
      epsilon = epsilon + this.stepOfEpsilon;

      if (epsilon << 1 > this.line.dx) {
        epsilon = epsilon - this.line.dx;
        y = y + this.stepOfY;
      }
    } while (x <= this.line.x1);
  }

  private fillCell(column: number, row: number) {
    if (this.line.isSlopeNormalized) {
      // Lines with normilized slopes
      // have their x and y coordinates swaped.
      // Make sure we swap them back before rasterizing a point.
      const temp = column;
      column = row;
      row = temp;
    }

    this.fillCellCallback(column, row);
  }
}
