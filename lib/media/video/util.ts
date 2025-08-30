import { SupportedMimeTypes } from '@/lib/constants';

export function extToMime(ext: string) {
  switch (ext) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mpeg':
      return 'video/mpeg';
    case 'mov':
      return 'video/quicktime';
    case 'gif':
      return 'image/gif';
    default:
      throw new Error(`Unsupported file extension: ${ext}`);
  }
}

export function mimeToExt(mimeType: SupportedMimeTypes | (string & {})) {
  switch (mimeType) {
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'video/mpeg':
      return 'mpeg';
    case 'video/quicktime':
      return 'mov';
    case 'image/gif':
      return 'gif';
    default:
      throw new Error(`Unsupported mime type: ${mimeType}`);
  }
}
