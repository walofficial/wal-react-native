import { JSXElementConstructor } from "react";
import { ReactElement } from "react";
import { NativeScrollEvent } from "react-native";
import { NativeSyntheticEvent } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { Feed, User } from "../api/generated";

export interface Photo {
  blur_hash: string;
  image_id: string;
  image_url: string[];
}

export type Affiliated = {
  name: string;
  icon_url: string;
};



export type PlaybackMedia = {
  hls: string;
  dash: string;
  mp4: string;
  thumbnail: string;
};

export type BaseVerification = {
  id: string;
  assignee_user_id: string;
  task_id: string;
  type: "image" | "video";
  state: string;
  transcode_job_name?: string;
  verified_media_playback?: PlaybackMedia;
  verified_image: string;
};

export type PublicVerification = BaseVerification & {
  match_id?: string;
  is_public: boolean;
  assignee_user: User;
  task: Feed;
};

export type AISummaryPoint = {
  text: string;
  timestamp?: string;
};

export type AIVideoSummary = {
  title: string;
  short_summary: string;
  relevant_statements: AISummaryPoint[];
  interesting_facts?: string[];
  did_you_know?: string[];
  statements?: string[];
};

export type ExternalVideo = {
  url: string;
  platform: "youtube" | "facebook" | "twitter";
  thumbnail_url?: string;
  duration?: string;
};


export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  images?: string[];
  siteName?: string;
  platform?: "youtube" | "facebook" | "x";
}

export interface LinkPreviewResponse {
  url: string;
  title?: string;
  siteName?: string;
  description?: string;
  mediaType: string;
  contentType?: string;
  images: string[];
  videos: Array<{
    url?: string;
    secureUrl?: string;
    type?: string;
    width?: string;
    height?: string;
  }>;
}

export type UserVerification = BaseVerification & {
  match_id: string;
  verification_trials?: {
    rejection_description?: string;
    rejection_reason?: string;
    file_url?: string;
  }[];
  is_public?: boolean;
};


export type FeedUser = User;




export enum ReactionType {
  LIKE = "like",
  LOVE = "love",
  LAUGH = "laugh",
  ANGRY = "angry",
  SAD = "sad",
  WOW = "wow",
  DISLIKE = "dislike",
}

export interface ReactionCount {
  count: number;
}

export interface ReactionsSummary {
  like: ReactionCount;
  love: ReactionCount;
  laugh: ReactionCount;
  angry: ReactionCount;
  sad: ReactionCount;
  wow: ReactionCount;
  dislike: ReactionCount;
}

export interface CurrentUserReaction {
  type: ReactionType;
}





export type MessageState = "UNREAD" | "READ" | "SENT";




export enum FriendRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
};


export type CheckLocationResponse = [
  boolean,
  { name: string; address: string; location: [number, number] }
];


export type Notification = {
  id: string;
  type: string;
  created_at: string;
  read: boolean;
  from_user_id: string;
  to_user_id: string;
  message?: string;
  verification_id: string;
  count?: number;
};

export type NotificationResponse = {
  notification: Notification;
  from_user: User;
};

export type ProfileInformationResponse = {
  username: string;
  stats: {
    likes: number;
    views: number;
  };
  photos: Photo[];
  is_friend: boolean;
  user_id: string;
};

export type GetRoomPreviewResponse = {
  number_of_participants: number;
  description: string;
  is_subscribed: boolean;
  exists: boolean;
  space_state: string;
};

export type CreateSpaceResponse = {
  room_name: string;
  verification_id: string;
  space_state: string;
  scheduled_at: string;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string;
  sources: {
    display_name: string;
    link: string;
    icon_link: string;
  }[];
};
export type NewsItemResponse = {
  news: NewsItem[];
};

export type AnimatedFlashListProps = {
  data: object[];
  horizontal: boolean;
  showsHorizontalScrollIndicator: boolean;
  pagingEnabled: boolean;
  keyExtractor: (item: any) => string;
  scrollEventThrottle: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  renderItem: (
    item: any
  ) => ReactElement<any | string | JSXElementConstructor<any>>;
  estimatedItemSize: number;
  getItemType: (
    item: any,
    index: number,
    extraData?: any
  ) => string | number | undefined;
  keyboardShouldPersistTaps?:
  | boolean
  | "always"
  | "never"
  | "handled"
  | undefined;
  initialScrollIndex: number;
  scrollEnabled: boolean;
  scrollX: SharedValue<number>;
  scrollIndex: number;
  setIndex: (index: number) => void;
  onScrollEnd?: () => void;
  overrideItemLayout: (
    layout: { span: number; size: number },
    item: any,
    index: number
  ) => void;
  ListEmptyComponent: React.ReactNode;
  ListFooterComponent: React.ReactNode;
  ListHeaderComponent: React.ReactNode;
  initialNumToRender: number;
  maxToRenderPerBatch: number;
  windowSize: number;
  getItemLayout: (
    data: any,
    index: number
  ) => { length: number; offset: number; index: number };
};

export type Summary = {
  original_post: string;
  key_findings: string;
};

export type Claim = {
  statement: string;
  verdict: string;
  reason: string;
};

export type MythVsFact = {
  myth: string;
  fact: string;
};

export type Source = {
  title: string;
  uri: string;
  domain?: string;
};
