// utils/isCanvasDrawn.js

/**
 * Checks whether the canvas contains a non-blank image inside the drawBox region.
 * Returns true if the canvas has at least one non-transparent pixel.
 *
 * @param {CanvasRenderingContext2D} ctx - The 2D context of the canvas.
 * @param {{ x: number, y: number }} drawBox - The padded draw area on the canvas.
 * @returns {boolean}
 */
export function isCanvasDrawn(ctx, drawBox = { x: 0, y: 0 }) {
  const { x, y } = drawBox;
  const pixel = ctx.getImageData(x + 1, y + 1, 1, 1).data;
  return ![...pixel].every(channel => channel === 0);
}
