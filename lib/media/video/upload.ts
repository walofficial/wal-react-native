import { AbortError } from "@/lib/async/cancelable";
import { CompressedVideo } from "@/lib/media/video/types";
import api from "@/lib/api";

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
    task_id: string;
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

  const uploadTask = api.uploadVideosToLocation(video, setProgress, params);

  if (signal.aborted) {
    throw new AbortError();
  }
  const res = await uploadTask.uploadAsync();

  if (!res?.body) {
    throw new Error("No response");
  }

  const responseBody = JSON.parse(res.body);

  if (signal.aborted) {
    throw new AbortError();
  }
  return responseBody;
}
