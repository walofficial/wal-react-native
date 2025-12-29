/**
 * Matrix transformation utilities for Android pinch-to-zoom
 * Based on Bluesky's implementation
 */

// A 2D transformation matrix represented as a 6-element array:
// [a, b, c, d, tx, ty] represents the matrix:
// | a  b  tx |
// | c  d  ty |
// | 0  0  1  |
export type TransformMatrix = [number, number, number, number, number, number];

export function createTransform(): TransformMatrix {
  'worklet';
  // Identity matrix
  return [1, 0, 0, 1, 0, 0];
}

export function readTransform(
  t: TransformMatrix,
): [translateX: number, translateY: number, scale: number] {
  'worklet';
  // Extract translation and scale from the matrix
  // Assuming uniform scaling and no rotation
  const [a, , , d, tx, ty] = t;
  const scale = Math.sqrt(a * a); // or Math.sqrt(d * d)
  return [tx, ty, scale];
}

export function prependTransform(
  target: TransformMatrix,
  source: TransformMatrix,
): void {
  'worklet';
  // Multiply: target = source * target
  const [a1, b1, c1, d1, tx1, ty1] = target;
  const [a2, b2, c2, d2, tx2, ty2] = source;

  target[0] = a2 * a1 + b2 * c1;
  target[1] = a2 * b1 + b2 * d1;
  target[2] = c2 * a1 + d2 * c1;
  target[3] = c2 * b1 + d2 * d1;
  target[4] = tx2 * a1 + ty2 * c1 + tx1;
  target[5] = tx2 * b1 + ty2 * d1 + ty1;
}

export function prependPan(
  target: TransformMatrix,
  translation: { x: number; y: number },
): void {
  'worklet';
  // Create a translation matrix and prepend it
  const panMatrix: TransformMatrix = [1, 0, 0, 1, translation.x, translation.y];
  prependTransform(target, panMatrix);
}

export function prependPinch(
  target: TransformMatrix,
  scale: number,
  origin: { x: number; y: number },
  translation: { x: number; y: number },
): void {
  'worklet';
  // Pinch is: translate to origin -> scale -> translate back -> apply extra translation
  // Combined into a single matrix operation

  // Scale around origin with additional translation
  const tx = origin.x * (1 - scale) + translation.x;
  const ty = origin.y * (1 - scale) + translation.y;

  const pinchMatrix: TransformMatrix = [scale, 0, 0, scale, tx, ty];
  prependTransform(target, pinchMatrix);
}

export function applyRounding(target: TransformMatrix): void {
  'worklet';
  // Round to avoid floating point drift
  const PRECISION = 1e6;
  target[0] = Math.round(target[0] * PRECISION) / PRECISION;
  target[1] = Math.round(target[1] * PRECISION) / PRECISION;
  target[2] = Math.round(target[2] * PRECISION) / PRECISION;
  target[3] = Math.round(target[3] * PRECISION) / PRECISION;
  target[4] = Math.round(target[4] * PRECISION) / PRECISION;
  target[5] = Math.round(target[5] * PRECISION) / PRECISION;
}

