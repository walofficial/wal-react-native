import * as Clipboard from "expo-clipboard";
import { Platform } from "react-native";
import { t } from "@/lib/i18n";
import * as FileSystem from "expo-file-system";
import { ImagePickerAsset } from "expo-image-picker";
import { compressIfNeeded } from "@/lib/media/manip";

export interface ClipboardImageData {
    uri: string;
    width: number;
    height: number;
    fileSize?: number;
    mimeType?: string;
}

/**
 * Check if clipboard has image content
 */
export async function hasClipboardImage(): Promise<boolean> {
    try {
        // On web, clipboard access requires user interaction
        if (Platform.OS === "web") {
            return false; // Conservative approach for web
        }
        return await Clipboard.hasImageAsync();
    } catch (error) {
        console.warn("Error checking clipboard image:", error);
        return false;
    }
}

/**
 * Get image from clipboard with proper error handling and format conversion
 */
export async function getClipboardImage(onError?: (message: string) => void): Promise<ClipboardImageData | null> {
    try {
        const hasImage = await Clipboard.hasImageAsync();
        if (!hasImage) {
            return null;
        }

        const clipboardImage = await Clipboard.getImageAsync({
            format: "jpeg",
            jpegQuality: 0.8,
        });

        if (!clipboardImage) {
            return null;
        }

        // Convert data URI to file URI for React Native compatibility
        const { data, size } = clipboardImage;

        // Validate image dimensions
        if (size.width <= 0 || size.height <= 0) {
            throw new Error("Invalid image dimensions");
        }

        // Generate a unique filename
        const timestamp = Date.now();
        const filename = `clipboard_image_${timestamp}.jpg`;
        const fileUri = `${FileSystem.documentDirectory}${filename}`;

        // Extract base64 data from the data URI
        let base64Data: string;
        if (data.startsWith("data:")) {
            const base64Index = data.indexOf(",");
            if (base64Index === -1) {
                throw new Error("Invalid data URI format");
            }
            base64Data = data.substring(base64Index + 1);
        } else {
            base64Data = data;
        }

        // Validate base64 data
        if (!base64Data || base64Data.length === 0) {
            throw new Error("Empty image data");
        }

        // Write the image data to a file
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Get file info to determine size
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (!fileInfo.exists) {
            throw new Error("Failed to save clipboard image");
        }

        return {
            uri: fileUri,
            width: size.width,
            height: size.height,
            fileSize: fileInfo.size,
            mimeType: "image/jpeg",
        };
    } catch (error) {
        console.error("Error getting clipboard image:", error);
        onError?.(t("errors.failed_clipboard_image"));
        return null;
    }
}

/**
 * Copy image to clipboard from a URI
 */
export async function copyImageToClipboard(imageUri: string): Promise<boolean> {
    try {
        if (!imageUri) {
            throw new Error("Image URI is required");
        }

        let base64String: string;

        // Handle different URI formats
        if (imageUri.startsWith("data:")) {
            // Already a data URI, extract base64
            const base64Index = imageUri.indexOf(",");
            if (base64Index === -1) {
                throw new Error("Invalid data URI format");
            }
            base64String = imageUri.substring(base64Index + 1);
        } else if (imageUri.startsWith("file://") || imageUri.startsWith("/")) {
            // Local file, read as base64
            const cleanUri = imageUri.replace("file://", "");

            // Check if file exists
            const fileInfo = await FileSystem.getInfoAsync(cleanUri);
            if (!fileInfo.exists) {
                throw new Error("Image file not found");
            }

            base64String = await FileSystem.readAsStringAsync(cleanUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
        } else {
            // Remote URL, download and convert
            const downloadResult = await FileSystem.downloadAsync(
                imageUri,
                FileSystem.documentDirectory + `temp_copy_${Date.now()}.jpg`
            );

            if (downloadResult.status !== 200) {
                throw new Error(`Failed to download image: ${downloadResult.status}`);
            }

            base64String = await FileSystem.readAsStringAsync(downloadResult.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Clean up temp file
            await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });
        }

        // Validate base64 data
        if (!base64String || base64String.length === 0) {
            throw new Error("Empty image data");
        }

        await Clipboard.setImageAsync(base64String);
        return true;
    } catch (error) {
        console.error("Error copying image to clipboard:", error);
        return false;
    }
}

/**
 * Paste image from clipboard and convert to ImagePickerAsset format
 */
export async function pasteImageFromClipboard(onError?: (message: string) => void): Promise<ImagePickerAsset | null> {
    try {
        const clipboardImage = await getClipboardImage(onError);
        if (!clipboardImage) {
            return null;
        }

        // Additional validation
        if (clipboardImage.width > 10000 || clipboardImage.height > 10000) {
            return null;
        }

        // Extract the actual file path without file:// prefix for compressIfNeeded
        let filePath = clipboardImage.uri;
        if (filePath.startsWith("file://")) {
            filePath = filePath.replace("file://", "");
        }

        // Compress the image if needed
        const compressedImage = await compressIfNeeded(
            {
                path: filePath, // Pass just the file path without file:// prefix
                width: clipboardImage.width,
                height: clipboardImage.height,
                size: clipboardImage.fileSize || 0,
            },
            1000000 // 1MB max size
        );

        // Convert to ImagePickerAsset format
        const asset: ImagePickerAsset = {
            uri: compressedImage.path.startsWith("file://")
                ? compressedImage.path
                : "file://" + compressedImage.path,
            width: clipboardImage.width,
            height: clipboardImage.height,
            fileSize: clipboardImage.fileSize,
            type: "image",
            fileName: `clipboard_image_${Date.now()}.jpg`,
            mimeType: "image/jpeg",
            exif: null,
            assetId: null,
            base64: null,
            duration: null,
        };

        return asset;
    } catch (error) {
        console.error("Error pasting image from clipboard:", error);
        onError?.(t("errors.failed_paste_image"));
        return null;
    }
}

/**
 * Check clipboard for both text and image content
 */
export async function getClipboardContent(): Promise<{
    hasText: boolean;
    hasImage: boolean;
    hasUrl: boolean;
}> {
    try {
        // Use Promise.allSettled to handle individual failures gracefully
        const results = await Promise.allSettled([
            Clipboard.hasStringAsync(),
            Clipboard.hasImageAsync(),
            Clipboard.hasUrlAsync(),
        ]);

        const hasText = results[0].status === "fulfilled" ? results[0].value : false;
        const hasImage = results[1].status === "fulfilled" ? results[1].value : false;
        const hasUrl = results[2].status === "fulfilled" ? results[2].value : false;

        return { hasText, hasImage, hasUrl };
    } catch (error) {
        console.warn("Error checking clipboard content:", error);
        return { hasText: false, hasImage: false, hasUrl: false };
    }
}

/**
 * Add clipboard listener for real-time clipboard monitoring
 */
export function addClipboardListener(
    callback: (hasImage: boolean, hasText: boolean) => void
) {
    if (Platform.OS === "web") {
        // Web doesn't support clipboard listeners
        return { remove: () => { } };
    }

    try {
        return Clipboard.addClipboardListener(async (event) => {
            const hasImage = event.contentTypes.includes(Clipboard.ContentType.IMAGE);
            const hasText = event.contentTypes.includes(Clipboard.ContentType.PLAIN_TEXT);
            callback(hasImage, hasText);
        });
    } catch (error) {
        console.warn("Error setting up clipboard listener:", error);
        return { remove: () => { } };
    }
}

/**
 * Clean up clipboard temporary files
 */
export async function cleanupClipboardFiles(): Promise<void> {
    try {
        const documentDir = FileSystem.documentDirectory;
        if (!documentDir) return;

        const files = await FileSystem.readDirectoryAsync(documentDir);
        const clipboardFiles = files.filter(file => file.startsWith("clipboard_image_"));

        // Remove clipboard files older than 1 hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        for (const file of clipboardFiles) {
            try {
                const filePath = `${documentDir}${file}`;
                const fileInfo = await FileSystem.getInfoAsync(filePath);

                if (fileInfo.exists && fileInfo.modificationTime && fileInfo.modificationTime < oneHourAgo) {
                    await FileSystem.deleteAsync(filePath, { idempotent: true });
                }
            } catch (error) {
                console.warn(`Error cleaning up file ${file}:`, error);
            }
        }
    } catch (error) {
        console.warn("Error during clipboard cleanup:", error);
    }
}

/**
 * Validate image file before processing
 */
export async function validateImageFile(uri: string): Promise<boolean> {
    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);

        if (!fileInfo.exists) {
            return false;
        }

        // Check file size (max 50MB)
        if (fileInfo.size && fileInfo.size > 50 * 1024 * 1024) {
            return false;
        }

        return true;
    } catch (error) {
        console.warn("Error validating image file:", error);
        return false;
    }
} 