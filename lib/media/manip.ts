import { Image as RNImage, Share as RNShare, Share } from "react-native";
import {
  cacheDirectory,
  copyAsync,
  deleteAsync,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  StorageAccessFramework,
  writeAsStringAsync,
} from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Buffer } from "buffer";
import { v4 as uuidv4 } from "uuid";

import { POST_IMG_MAX } from "@/lib/constants";
import { isAndroid, isIOS } from "@/lib/platform";
import { Dimensions } from "./types";

export async function compressIfNeeded(img: any, maxSize: number = 1000000) {
  const origUri = `file://${img.path}`;
  if (img.size < maxSize) {
    return img;
  }
  const resizedImage = await doResize(origUri, {
    width: img.width,
    height: img.height,
    mode: "stretch",
    maxSize,
  });
  const finalImageMovedPath = await moveToPermanentPath(
    resizedImage.path,
    ".jpg"
  );
  const finalImg = {
    ...resizedImage,
    path: finalImageMovedPath,
  };
  return finalImg;
}

export function getImageDim(path: string): Promise<Dimensions> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      path,
      (width, height) => {
        resolve({ width, height });
      },
      reject
    );
  });
}

// internal methods
// =

interface DoResizeOpts {
  width: number;
  height: number;
  mode: "contain" | "cover" | "stretch";
  maxSize: number;
}

async function doResize(
  localUri: string,
  opts: DoResizeOpts
): Promise<{
  path: string;
  mime: string;
  size: number;
  width: number;
  height: number;
}> {
  // We need to get the dimensions of the image before we resize it. Previously, the library we used allowed us to enter
  // a "max size", and it would do the "best possible size" calculation for us.
  // Now instead, we have to supply the final dimensions to the manipulation function instead.
  // Performing an "empty" manipulation lets us get the dimensions of the original image. React Native's Image.getSize()
  // does not work for local files...
  const imageRes = await manipulateAsync(localUri, [], {});
  const newDimensions = getResizedDimensions({
    width: imageRes.width,
    height: imageRes.height,
  });

  for (let i = 0; i < 9; i++) {
    // nearest 10th
    const quality = Math.round((1 - 0.1 * i) * 10) / 10;
    const resizeRes = await manipulateAsync(
      localUri,
      [{ resize: newDimensions }],
      {
        format: SaveFormat.JPEG,
        compress: quality,
      }
    );

    const fileInfo = await getInfoAsync(resizeRes.uri);
    if (!fileInfo.exists) {
      throw new Error(
        "The image manipulation library failed to create a new image."
      );
    }

    if (fileInfo.size < opts.maxSize) {
      safeDeleteAsync(imageRes.uri);
      return {
        path: normalizePath(resizeRes.uri),
        mime: "image/jpeg",
        size: fileInfo.size,
        width: resizeRes.width,
        height: resizeRes.height,
      };
    } else {
      safeDeleteAsync(resizeRes.uri);
    }
  }
  throw new Error(
    `This image is too big! We couldn't compress it down to ${opts.maxSize} bytes`
  );
}

async function moveToPermanentPath(path: string, ext: string): Promise<string> {
  const randomString = Math.random().toString(36).substring(2, 15);
  const filename = `${randomString}-${randomString}`;

  // cacheDirectory will not ever be null on native, but it could be on web. This function only ever gets called on
  // native so we assert as a string.
  const destinationPath = joinPath(cacheDirectory as string, filename + ext);
  await copyAsync({
    from: normalizePath(path),
    to: normalizePath(destinationPath),
  });
  safeDeleteAsync(path);
  return normalizePath(destinationPath);
}

export async function safeDeleteAsync(path: string) {
  // Normalize is necessary for Android, otherwise it doesn't delete.
  const normalizedPath = normalizePath(path);
  try {
    await deleteAsync(normalizedPath, { idempotent: true });
  } catch (e) {
    console.error("Failed to delete file", e);
  }
}

function joinPath(a: string, b: string) {
  if (a.endsWith("/")) {
    if (b.startsWith("/")) {
      return a.slice(0, -1) + b;
    }
    return a + b;
  } else if (b.startsWith("/")) {
    return a + b;
  }
  return a + "/" + b;
}

function normalizePath(str: string, allPlatforms = false): string {
  if (isAndroid || allPlatforms) {
    if (!str.startsWith("file://")) {
      return `file://${str}`;
    }
  }
  return str;
}

export async function saveBytesToDisk(
  filename: string,
  bytes: Uint8Array,
  type: string
) {
  const encoded = Buffer.from(bytes).toString("base64");
  return await saveToDevice(filename, encoded, type);
}

export async function saveToDevice(
  filename: string,
  encoded: string,
  type: string
) {
  try {
    if (isIOS) {
      await withTempFile(filename, encoded, async (tmpFileUrl) => {
        await Share.share({ url: tmpFileUrl });
      });
      return true;
    } else {
      const permissions =
        await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        return false;
      }

      const fileUrl = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        type
      );

      await writeAsStringAsync(fileUrl, encoded, {
        encoding: EncodingType.Base64,
      });
      return true;
    }
  } catch (e) {
    return false;
  }
}

async function withTempFile<T>(
  filename: string,
  encoded: string,
  cb: (url: string) => T | Promise<T>
): Promise<T> {
  // cacheDirectory will not ever be null so we assert as a string.
  // Using a directory so that the file name is not a random string
  const tmpDirUri = joinPath(cacheDirectory as string, String(uuidv4()));
  await makeDirectoryAsync(tmpDirUri, { intermediates: true });

  try {
    const tmpFileUrl = joinPath(tmpDirUri, filename);
    await writeAsStringAsync(tmpFileUrl, encoded, {
      encoding: EncodingType.Base64,
    });

    return await cb(tmpFileUrl);
  } finally {
    safeDeleteAsync(tmpDirUri);
  }
}

export function getResizedDimensions(originalDims: {
  width: number;
  height: number;
}) {
  if (
    originalDims.width <= POST_IMG_MAX.width &&
    originalDims.height <= POST_IMG_MAX.height
  ) {
    return originalDims;
  }

  const ratio = Math.min(
    POST_IMG_MAX.width / originalDims.width,
    POST_IMG_MAX.height / originalDims.height
  );

  return {
    width: Math.round(originalDims.width * ratio),
    height: Math.round(originalDims.height * ratio),
  };
}
