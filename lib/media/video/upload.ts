import * as FileSystem from 'expo-file-system';
import { AbortError } from '@/lib/async/cancelable';
import { CompressedVideo } from '@/lib/media/video/types';
import { UploadToLocationResponse } from '@/lib/api/generated';
import { API_BASE_URL } from '@/lib/api/config';
import { supabase } from '@/lib/supabase';

async function getCurrentAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

const uploadVideosToLocation = async (
  video: CompressedVideo,
  setProgress: (progress: number) => void,
  params: {
    feed_id: string;
    recording_time: number;
    text_content: string;
  },
) => {
  const token = await getCurrentAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  return FileSystem.createUploadTask(
    API_BASE_URL + '/verify-videos/upload-to-location',
    video.uri,
    {
      headers: {
        'content-type': video.mimeType,
        Authorization: `Bearer ${token}`,
      },
      httpMethod: 'POST',
      fieldName: 'video_file',
      parameters: {
        feed_id: params.feed_id,
        recording_time: params.recording_time.toString(),
        text_content: params.text_content,
      },
      mimeType: video.mimeType,
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    },
    (p) => setProgress(p.totalBytesSent / p.totalBytesExpectedToSend),
  );
};

export async function uploadVideo({
  video,
  setProgress,
  signal,
  params,
}: {
  video: CompressedVideo;
  setProgress: (progress: number) => void;
  signal: AbortSignal;
  params: {
    feed_id: string;
    recording_time: number;
    text_content: string;
  };
}) {
  if (signal.aborted) {
    throw new AbortError();
  }

  if (signal.aborted) {
    throw new AbortError();
  }

  const uploadTask = await uploadVideosToLocation(video, setProgress, params);

  if (signal.aborted) {
    throw new AbortError();
  }

  const res = await uploadTask.uploadAsync();

  if (!res?.body) {
    throw new Error('No response');
  }

  const responseBody = JSON.parse(res.body);

  if (signal.aborted) {
    throw new AbortError();
  }
  return responseBody as UploadToLocationResponse;
}
