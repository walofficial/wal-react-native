import { P } from "@/components/ui/typography";
import { JSXElementConstructor } from "react";
import { ReactElement } from "react";
import { NativeScrollEvent } from "react-native";
import { NativeSyntheticEvent } from "react-native";
import { SharedValue } from "react-native-reanimated";

export interface Photo {
  blur_hash: string;
  image_id: string;
  image_url: string[];
}

export type Affiliated = {
  name: string;
  icon_url: string;
};

export interface User {
  id: string;
  external_user_id: string;
  email: string;
  username: string;
  name?: string;
  public_id: string;
  first_name?: string;
  last_name?: string;
  photos: Photo[];
  interests: string[];
  date_of_birth: string;
  city: string;
  gender: string;
  location: {
    type: string;
    coordinates: number[];
  };
  phone_number: string;
  is_photos_hidden: boolean;
  verified_task_completion_media: string[];
  instant_db_token: string;

  // Added by FE
  is_swiped?: boolean;
  affiliated?: Affiliated;
}

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
  task: Task;
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

export type LocationFeedPost = {
  id: string;
  assignee_user_id: string;
  task_id: string;
  state: string;
  transcode_job_name: string;
  verified_media_playback: PlaybackMedia;
  verified_image: string;
  is_public: boolean;
  assignee_user: User;
  last_modified_date: string;
  task: Task;
  text_content?: string;
  is_live: boolean;
  has_recording: boolean;
  livekit_room_name?: string;
  space_state?: string;
  is_space?: boolean;
  scheduled_at: string;
  image_gallery?: string[];
  is_factchecked?: boolean;
  title?: string;
  sources?: {
    title: string;
    uri: string;
    domain: string;
  }[];
  text_summary?: string;
  fact_check_data?: FactCheckResponse;
  external_video?: ExternalVideo;
  ai_video_summary?: AIVideoSummary;
  ai_video_summary_status?: "PENDING" | "COMPLETED" | "FAILED";
  metadata_status?: "PENDING" | "COMPLETED" | "FAILED";
  fact_check_status?: "PENDING" | "COMPLETED" | "FAILED";
  preview_data?: LinkPreviewData;
  is_generated_news?: boolean;
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

export type TaskInformationStory = {
  task: Task;
  verificationCount: number;
};

export type FeedUser = User;

export type GetPromotion = {
  promotion_status: string;
  promotion_expiration_timestamp: string;
};

export type GetPromationExpired = {
  promotion_status: "PROMOTION_EXPIRED";
};
export type ChatRoom = {
  id: string;
  participants: User[];
  created_at: string;
  updated_at: string;
  target_user_id: string;
  user_public_key: string;
  last_message: {
    id: string;
    author_id: string;
    recipient_id: string;
    room_id: string;
    encrypted_content: string;
    message: string;
    message_state: "SENT" | "DELIVERED" | "READ";
    nonce: string;
    sent_date: string;
  };
};

export type CommentItemResponse = {
  comment: Comment;
  is_liked_by_user: boolean;
};

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

export type Comment = {
  id: string;
  verification_id: string;
  author_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  tags: string[];
  parent_comment_id: string | null;
  ai_analysis: {
    sentiment: string;
    labels: string[];
    toxicity_score: number;
    summary: string | null;
    generated_at: string;
  };
  score: number;
  author: User;
  is_liked_by_user: boolean;
  reactions_summary?: ReactionsSummary;
  current_user_reaction?: CurrentUserReaction;
};

export interface Match {
  id: string;
  tasks: Task[];
  task_verification_media_type: string;
  task_completer_user_ids: string[];
  participants: string[];
  assigned_task: Task;
  target_user: User;
  promotion_expiration_timestamp: string;
  is_unmatched?: boolean;
  unmatched_by_user_id: string;
  is_friend: boolean;
}

export interface Task {
  id: string;
  task_title: string;
  display_name: string;
  task_verification_media_type: "image" | "video" | "both";
  owner_id: string;
  task_validation: TaskValidation;
  task_verification_requirements: TaskVerification[];
  start_timestamp: string;
  task_verification_example_sources: TaskExampleMedia[];
  task_description: string;
  task_category_id: string;
  task_location?: ILocation;
  task_locations: ILocation[];
  live_user_count?: number;
  can_pin_user_ids: string[];
}

export type ILocation = {
  coordinates: number[];
  name: string;
};

export type TaskExampleMedia = {
  id: string;
  name: string;
  media_type: string;
  image_media_url: string;
  playback: PlaybackMedia;
};

export interface TaskValidation {
  result: boolean;
}

export interface TaskVerification {
  name: string;
}

export type ContactDetails = SocialContact[];

export interface SocialContact {
  appName: string;
  contact: string;
}

export type MessageState = "UNREAD" | "READ" | "SENT";

export interface ChatMessage {
  id: string;
  author_id: string;
  message: string;
  recipient_id: string;
  message_state: MessageState;
  encrypted_content: string;
  nonce: string;
  temporary_id: string;
  room_id: string;
  sent_date: string;
}

export type TaskCategoryName = "Gym" | "Funny" | "Find" | "Drinks" | "Popular";

export interface TaskCategory {
  id: string;
  title: TaskCategoryName;
  display_name: string;
  hidden?: boolean;
  order?: number;
}

export type ChatMessages = ChatMessage[];

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

export type ChallangeRequest = {
  challenge_id: string;
  user: User;
  task: Task;
};

export type PublicChallenge = {
  challenge_id: string;
  task: Task;
  expiration_date: string;
  is_challenging: boolean;
  live_user_count: number;
};

export type FriendFeedItem = {
  verification_id: string;
  user: User;
  task: Task;
  verified_media_playback?: PlaybackMedia;
  verified_image: string;
  last_modified_date: string;
};

export type CheckLocationResponse = [
  boolean,
  { name: string; address: string; location: [number, number] }
];

export type LocationsResponse = {
  nearest_tasks: {
    nearest_location: {
      name: string;
      address: string;
      location: [number, number];
    };
    task: Task;
  }[];
  tasks_at_location: Task[];
};

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

export type FactCheckResponse = {
  factuality?: number;
  result?: boolean;
  reason?: string;
  reason_summary?: string;
  references?: {
    url: string;
    key_quote: string;
    is_supportive: boolean;
    source_title: string;
  }[];
  usage?: {
    tokens: number;
  };
  has_rated?: boolean;
  ratings_count?: number;
};
