/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type Dimensions = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

export type ThumbRect = {
  pageX: number;
  pageY: number;
  width: number;
  height: number;
};

export type Transform = (
  | { translateX: number }
  | { translateY: number }
  | { scale: number }
  | { scaleX: number }
  | { scaleY: number }
)[];

export type ImageSource = {
  uri: string;
  dimensions: Dimensions | null;
  thumbUri: string;
  thumbDimensions: Dimensions | null;
  thumbRect: ThumbRect | null;
  alt?: string;
  type: 'image' | 'circle-avi' | 'rect-avi';
  verificationId?: string;
  /** Unique tag for shared element transition animation */
  transitionTag?: string;
};
