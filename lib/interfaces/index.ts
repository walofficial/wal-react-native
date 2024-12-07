import { P } from "@/components/ui/typography";

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
  public_id: string;
  photos: Photo[];
  interests: string[];
  date_of_birth: string;
  city: string;
  is_in_waitlist: boolean;
  gender: string;
  location: {
    type: string;
    coordinates: number[];
  };
  phone_number: string;
  is_photos_hidden: boolean;
  verified_task_completion_media: string[];

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
};

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
  is_friend: boolean;
  target_user_public_key: string;
  target_user_id: string;
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
  thumbnail_url: string;
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
  message_state: MessageState;
  encrypted_content: string;
  nonce: string;
  temporary_id: string;
  room_id: string;
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
