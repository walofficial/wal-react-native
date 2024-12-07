/* eslint-disable no-debugger */
//@ts-ignore

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { WORKERS } from "./config";
import {
  ChatMessages,
  FeedUser,
  GetPromationExpired,
  GetPromotion,
  Match,
  PublicVerification,
  Task,
  TaskCategory,
  TaskInformationStory,
  UserVerification,
  FriendRequest,
  User,
  ChallangeRequest,
  FriendFeedItem,
  CheckLocationResponse,
  LocationsResponse,
  NotificationResponse,
  ChatRoom,
  LocationFeedPost,
  ChatMessage,
} from "@/lib/interfaces";
import { supabase } from "../supabase";
import { Contact } from "expo-contacts";
import ProtocolService from "../services/ProtocolService";

const { AUTH_WORKER } = WORKERS;

export class ApiClient {
  supabaseUserToken?: string;

  authWorker: AxiosInstance;

  constructor() {
    supabase.auth.onAuthStateChange((_event, session) => {
      this.supabaseUserToken = session?.access_token;
      this.updateAxiosInstancesWithToken();
    });

    this.authWorker = this.createAxiosInstance(AUTH_WORKER);
  }

  createAxiosInstance(
    baseURL: string,
    useCustomInterceptor: boolean = true
  ): AxiosInstance {
    const instance = axios.create({
      baseURL,
      headers: {
        "x-impersonate-user-id": process.env.NEXT_PUBLIC_IMPERSONATE_USER_ID,
      },
    });

    if (useCustomInterceptor) {
      instance.interceptors.request.use(this.addTokenToRequest);
      instance.interceptors.response.use(undefined, this.createInterceptor());
    }
    return instance;
  }

  addTokenToRequest = (
    config: InternalAxiosRequestConfig<any>
  ): InternalAxiosRequestConfig<any> => {
    if (this.supabaseUserToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.supabaseUserToken}`,
      };
    }
    return config;
  };

  createInterceptor() {
    return async (error: any) => {
      if (error.response?.status === 401) {
        if (this.supabaseUserToken) {
          this.updateAxiosInstancesWithToken();
          error.config.headers.Authorization = `Bearer ${this.supabaseUserToken}`;
          return axios(error.config);
        }
      }
      return Promise.reject(error);
    };
  }

  updateAxiosInstancesWithToken() {
    if (this.supabaseUserToken) {
      this.authWorker.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${this.supabaseUserToken}`;
    } else {
      delete this.authWorker.defaults.headers.common["Authorization"];
    }
  }

  resetToken() {
    this.supabaseUserToken = undefined;
    this.updateAxiosInstancesWithToken();
  }

  getUser = async (): Promise<null> => {
    const response = await this.authWorker.get(WORKERS.AUTH_WORKER + "hey");

    if (!response.data) {
      throw new Error("API request failed");
    }

    return response.data;
  };

  getUserVerifications = async (page: number, pageSize: number = 10) => {
    try {
      const { data } = await this.authWorker.get<LocationFeedPost>(
        "/user/get-verifications",
        {
          params: {
            page,
            page_size: pageSize,
          },
        }
      );
      return {
        page,
        data,
      };
    } catch (error) {
      return {
        page,
        data: [],
      };
    }
  };

  checkAccess = async (code: string) => {
    if (code === "anon") {
      return { ok: true };
    }
    const { data } = await this.authWorker.post("/check-access-code", {
      code,
    });
    return data;
  };

  getAccess = async () => {
    const { data } = await this.authWorker.get("/access/list-access-codes");
    return data as {
      codes: string[];
    };
  };

  inviteUserToMent = async (targetPhoneNumber: string): Promise<null> => {
    const { data } = await this.authWorker.post("/access/send-access-code", {
      targetPhoneNumber,
    });

    return data;
  };

  updateMessages = async (messages: { id: string; state: string }[]) => {
    if (messages.some((message) => !message.id)) {
      throw new Error("All messages must have an id");
    }
    await this.authWorker.post("/chat/update-messages", {
      messages,
    });
  };
  fetchMessages = async (
    page: number | boolean,
    page_size: number,
    room_id: string,
    recipientId: string,
    localUserId: string
  ) => {
    if (!page) {
      throw new Error("Fetched all pages");
    }
    const { data } = await this.authWorker.get(`/chat/messages`, {
      params: {
        room_id,
        page: page,
        page_size,
      },
    });

    let decryptedMessages: ChatMessages = [];
    try {
      decryptedMessages = await Promise.all(
        data.messages.map(async (message: ChatMessage) => {
          try {
            if (message.encrypted_content && message.nonce) {
              let decryptedMessage = "";

              decryptedMessage = await ProtocolService.decryptMessage(
                localUserId === message.author_id
                  ? recipientId
                  : message.author_id,
                {
                  encryptedMessage: message.encrypted_content,
                  nonce: message.nonce,
                }
              );

              return {
                ...message,
                message: decryptedMessage,
              };
            }
            return message;
          } catch (decryptError) {
            console.error(
              `Failed to decrypt message ${message.id}:`,
              decryptError
            );
            return {
              ...message,
              message: "[Unable to decrypt message]",
            };
          }
        })
      );
    } catch (error) {
      console.error("Error processing messages", error);
      decryptedMessages = data.messages.map((message) => ({
        ...message,
        message: message.encrypted_content
          ? "[Unable to decrypt message]"
          : message.message,
      }));
    }

    return {
      data: decryptedMessages,
      page,
      previousCursor: typeof page === "number" && page > 1 ? page - 1 : null,
      nextCursor:
        decryptedMessages.length === page_size
          ? typeof page === "number"
            ? page + 1
            : null
          : null,
    } as {
      data: ChatMessages;
      page: number;
      previousCursor?: number;
      nextCursor?: number;
    };
  };

  updateUser = async (data: any) => {
    const response = await this.authWorker.put("/user/update", data);

    return response;
  };

  createUser = async (data: any) => {
    const { data: newUser } = await this.authWorker.post(
      "/user/create-user",
      data
    );

    return newUser;
  };

  getSingleTaskById = async (taskId: string): Promise<Task> => {
    const { data } = await this.authWorker.get(`/tasks/single/${taskId}`);
    return data as Task;
  };

  getTask = async (): Promise<Task> => {
    if (!this.supabaseUserToken) {
      throw new Error("no token");
    }
    const { data } = await this.authWorker.get("/user/task");
    return data as Task;
  };

  updateUserVerificationVisibility = async (
    verificationId: string,
    isPublic: boolean
  ) => {
    const { data } = await this.authWorker.post(
      "/user/update-verification-visibility",
      {
        verification_id: verificationId,
        is_public: isPublic,
      }
    );
    return data as UserVerification[];
  };
  getMatch = async (match_id: string): Promise<Match> => {
    if (!match_id) {
      throw new Error("Match id is required");
    }
    if (match_id.length < 10) {
      throw new Error("Invalid match id");
    }
    const { data } = await this.authWorker.get(`/user/match`, {
      params: { match_id },
    });
    return data as Match;
  };

  getMessageRoom = async (roomId: string): Promise<ChatRoom> => {
    const { data } = await this.authWorker.get(`/chat/message-chat-room`, {
      params: { room_id: roomId },
    });
    if (data.target_user_public_key) {
      await ProtocolService.storeRemotePublicKey(
        data.target_user_id,
        data.user_public_key
      );
    }
    return data as ChatRoom;
  };

  createRoom = async (targetUserId: string, keyBundle: any) => {
    const { data } = await this.authWorker.post("/chat/create-chat-room", {
      target_user_id: targetUserId,
      user_public_key: keyBundle?.publicKey,
    });

    return data as {
      chat_room_id: string;
      success: true;
      target_public_key: any;
    };
  };

  createTask = async (data: any) => {
    await this.authWorker.post("/user/create-task", data);
  };

  selectTask = async (task_id: string | null) => {
    const { data } = await this.authWorker.post("/user/select-task", {
      task_id,
    });

    return data.task;
  };

  getCity = async (latitude: any, longitude: any) => {
    const { data } = await this.authWorker.post("/user/location", {
      latitude,
      longitude,
    });

    return data;
  };

  uploadPhotos = async (formData: any) => {
    const { data } = await this.authWorker.post("/upload-photos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  };

  unmatch = async (matchId: string) => {
    const { data } = await this.authWorker.post("/user/unmatch", {
      match_id: matchId,
    });

    return data;
  };

  trackImpression = async (verificationId: string) => {
    try {
      const { data } = await this.authWorker.post(
        `/live-actions/track-impressions/${verificationId}`
      );
      return data;
    } catch (error) {
      console.error("Failed to track impression", error);
      throw error;
    }
  };

  getVerificationImpressions = async (verificationId: string) => {
    const { data } = await this.authWorker.get(
      `/live-actions/get-impressions/${verificationId}`
    );
    return data;
  };

  fetchSuggestedInterests = async (interests: string[]) => {
    const { data } = await this.authWorker.post("/generate-interests", {
      chosen_interests: interests,
    });
    if (!data || !data.interests || !data.interests.length) {
      return ["Politics", "Traveling", "Gaming", "Dating"];
    }
    return data.interests;
  };

  generateRandomTasks = async ({ refetch }: { refetch: boolean }) => {
    const { data } = await this.authWorker.post("/tasks/random-tasks", {
      refetch,
    });

    return data.tasks;
  };

  fetchDailyTasksByCategory = async (
    categoryId: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    const headers: Record<string, string> = {};
    if (coords) {
      headers["user-location"] = `${coords.latitude},${coords.longitude}`;
    }

    const { data } = await this.authWorker.get("/tasks/daily", {
      params: {
        category_id: categoryId,
      },
      headers,
    });

    return data as Task[];
  };

  isUserNameAvailable = async (username: string) => {
    const { data } = await this.authWorker.get(
      "/user/check-username/" + username
    );
    return data;
  };

  fetchLocations = async (
    categoryId: string,
    coords?: { latitude: number; longitude: number }
  ): Promise<LocationsResponse> => {
    const headers: Record<string, string> = {};
    if (coords) {
      headers["x-user-location-latitude"] = coords.latitude.toString();
      headers["x-user-location-longitude"] = coords.longitude.toString();
    }
    try {
      const { data } = await this.authWorker.get("/tasks/locations", {
        params: {
          category_id: categoryId,
        },
        headers,
      });
      return data;
    } catch (error) {
      return {
        nearest_tasks: [],
        tasks_at_location: [],
      };
    }
  };

  uploadTaskExamples = async (formData: any) => {
    const { data } = await this.authWorker.post(
      "/verification-example-media",
      formData
    );

    return data;
  };

  deleteTaskExample = async (values: { taskId: string; exampleId: string }) => {
    const { data } = await this.authWorker.delete(
      "/verification-example-media",
      {
        params: {
          task_id: values.taskId,
          task_example_id: values.exampleId,
        },
      }
    );

    return data;
  };

  verifyPhotos = async (formData: any) => {
    const { data } = await this.authWorker.post("/verify-photos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  };

  uploadPhotosToLocation = async (formData: any) => {
    const { data } = await this.authWorker.post(
      "/verify-photos/upload-to-location",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  };

  verifyVideo = async (
    formData: FormData,
    uploadProgress: (progress: number) => void
  ) => {
    try {
      const { data } = await this.authWorker.post("/verify-videos", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) => {
          if (e.total) {
            uploadProgress((e.loaded / e.total) * 100);
          }
        },
      });
      return data;
    } catch (error) {
      throw error;
    }
  };

  uploadVideosToLocation = async (
    formData: FormData,
    uploadProgress: (progress: number) => void
  ) => {
    try {
      const { data } = await this.authWorker.post(
        "/verify-videos/upload-to-location",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (e) => {
            if (e.total) {
              uploadProgress((e.loaded / e.total) * 100);
            }
          },
        }
      );
      return {
        ...data,
      };
    } catch (error) {
      throw error;
    }
  };

  tryNextBatch = async () => {
    const { data } = await this.authWorker.get("/user/feed/next-batch");
    return data as FeedUser[];
  };

  getTaskStories = async () => {
    const { data } = await this.authWorker.get<TaskInformationStory[]>(
      "/user/feed/task-stories"
    );
    return data.filter(
      (item) => !!item.task.task_verification_example_sources?.length
    );
  };

  getLocationFeedPaginated = async (taskId: string, page: number) => {
    try {
      const { data } = await this.authWorker.get<PublicVerification[]>(
        "/user/feed/location-feed/" + taskId,
        {
          params: {
            page,
          },
        }
      );

      return {
        page,
        data,
      };
    } catch (error) {
      return {
        page,
        data: [],
      };
    }
  };

  getTaskStoriesPaginated = async (taskId: string, page: number) => {
    const { data } = await this.authWorker.get<LocationFeedPost[]>(
      "/user/feed/task-stories/" + taskId,
      {
        params: {
          page,
        },
      }
    );
    return {
      page,
      data,
    } as unknown as {
      page: number;
      data: PublicVerification[];
    };
  };

  upsertFCMData = async (token: string | null) => {
    await this.authWorker.put("/user/upsert-fcm", {
      data: {
        expo_push_token: token,
      },
    });

    return true;
  };

  deleteFCMData = async (expoPushToken: string) => {
    await this.authWorker.delete("/user/delete-fcm", {
      data: {
        expo_push_token: expoPushToken,
      },
    });
    return true;
  };

  getFCMData = async () => {
    const { data } = await this.authWorker.get("/user/get-fcm");
    return data;
  };

  acceptUser = async (target_user_id: string) => {
    const { data } = await this.authWorker.post("/user/accept", {
      target_user_id,
    });

    return data;
  };

  rejectUser = async (target_user_id: string) => {
    const { data } = await this.authWorker.post("/user/reject", {
      target_user_id,
    });

    return data;
  };

  getMatches = async () => {
    const { data } = await this.authWorker.get("/user/matches");

    return data as Match[];
  };

  pokeLiveUser = async (userId: string, taskId: string) => {
    const { data } = await this.authWorker.post(
      "/live-actions/poke/" + userId + "/" + taskId
    );
    return data;
  };

  getUserVerification = async (taskId: string, userId?: string) => {
    const { data } = await this.authWorker.get("/user/get-verification", {
      params: {
        task_id: taskId,
        user_id: userId,
      },
    });

    return data;
  };

  getPinnedFeedItem = async (taskId: string) => {
    const { data } = await this.authWorker.get("/get_pinned_verification", {
      params: {
        task_id: taskId,
      },
    });

    return data;
  };

  pinFeedItem = async (taskId: string, verificationId: string) => {
    const { data } = await this.authWorker.post("/pin_verification", {
      task_id: taskId,
      verification_id: verificationId,
    });
    return data;
  };

  removePinnedFeedItem = async (taskId: string, verificationId: string) => {
    const { data } = await this.authWorker.delete("/pin_verification", {
      params: {
        task_id: taskId,
      },
    });
    return data;
  };

  getVerificationById = async (verificationId: string) => {
    try {
      const { data } = await this.authWorker.get("/user/get-verification", {
        params: {
          verification_id: verificationId,
        },
      });
      return data as PublicVerification;
    } catch (error) {
      return null;
    }
  };

  startPromo = async (matchId: string) => {
    const { data } = await this.authWorker.post("/user/promotion", {
      match_id: matchId,
    });

    return data as GetPromotion | GetPromationExpired;
  };

  fetchDailyTasksCategories = async (coords?: {
    latitude: number;
    longitude: number;
  }) => {
    const headers: Record<string, string> = {};
    if (coords) {
      headers["user-location"] = `${coords.latitude},${coords.longitude}`;
    }

    const { data } = await this.authWorker.get(
      "/tasks/daily-tasks-categories",
      { headers }
    );
    return data.filter((category: TaskCategory) => !category.hidden);
  };

  signup = async (values: any) => {};

  deleteUser = async () => {
    const { data } = await this.authWorker.delete("/user/delete");
    return data;
  };

  checkRegisteredUsers = async (contactsToCheck: Contact[]) => {
    const phoneNumbers = contactsToCheck
      .flatMap(
        (contact) =>
          contact.phoneNumbers?.map((phoneNumber) => phoneNumber.number) || []
      )
      .filter(Boolean);
    const { data } = await this.authWorker.post(
      "/user/check_registered_users",
      {
        phone_numbers: phoneNumbers,
      }
    );

    return data;
  };

  getFriendRequests = async () => {
    const { data } = await this.authWorker.get("/friends/requests");
    return data as { user: User; request: FriendRequest }[];
  };

  sendFriendRequest = async (userId: string) => {
    const response = await this.authWorker.post("/friends/request", {
      target_user_id: userId,
    });

    if (!response.data) {
      throw new Error("Failed to send friend request");
    }

    return response.data;
  };

  acceptFriendRequest = async (requestId: string) => {
    const { data } = await this.authWorker.put(
      `/friends/request/${requestId}/accept`
    );
    return data;
  };

  rejectFriendRequest = async (requestId: string) => {
    const { data } = await this.authWorker.put(
      `/friends/request/${requestId}/reject`
    );
    return data;
  };

  getFriendsList = async (page: number, pageSize: number) => {
    const { data } = await this.authWorker.get("/friends/list", {
      params: {
        page,
        page_size: pageSize,
      },
    });
    return data as User[];
  };

  deleteFriend = async (friendId: string) => {
    const { data } = await this.authWorker.delete(
      `/friends/remove/${friendId}`
    );
    return data;
  };

  getAnonListForTask = async (taskId: string) => {
    const { data } = await this.authWorker.get("/tasks/anon-list", {
      params: {
        task_id: taskId,
      },
    });
    return data as {
      user: User;
      challenge_id: string;
      is_friend: boolean;
    }[];
  };

  getAnonListCountForTask = async (taskId: string) => {
    const { data } = await this.authWorker.get("/tasks/anon-list/count", {
      params: {
        task_id: taskId,
      },
    });
    return (data?.count || 0) as number;
  };

  getMyChallangeRequests = async (): Promise<ChallangeRequest[]> => {
    try {
      const { data } = await this.authWorker.get("/challenges/my-requests");
      return data as ChallangeRequest[];
    } catch (error) {
      console.log("error", error);
      return [];
    }
  };

  getRatingForTask = async (taskId: string) => {
    const { data } = await this.authWorker.get(
      "/user/feed/check-task-rating/" + taskId
    );
    return data;
  };

  rateTask = async (
    taskId: string,
    rate_type: "like" | "dislike" | "close"
  ) => {
    try {
      const { data } = await this.authWorker.post(
        "/user/feed/rate-task/" + taskId,
        {
          rate_type,
        }
      );
      return data;
    } catch (error) {
      console.log("error", JSON.stringify(error.response.data));
      throw error;
    }
  };

  checkLocation = async (
    taskId: string,
    latitude: number,
    longitude: number
  ) => {
    const { data } = await this.authWorker.get("/tasks/check-location", {
      params: {
        task_id: taskId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      },
    });
    return data as CheckLocationResponse;
  };

  approveVerification = async (verificationId: string) => {
    const { data } = await this.authWorker.post(
      "/admin-panel/approve/" + verificationId
    );
    return data;
  };

  isChallengingThisTask = async (taskId: string) => {
    try {
      const { data } = await this.authWorker.get("/challenges/is-challenging", {
        params: {
          task_id: taskId,
        },
      });
      return data as {
        is_challenging: boolean;
        challenge_id: string;
        task_id: string;
        is_public_disabled: boolean;
      };
    } catch (error) {
      console.log("error", error);
      return {
        is_challenging: false,
        is_public_disabled: false,
      };
    }
  };

  makePublicChallange = async (taskId: string) => {
    const { data } = await this.authWorker.post("/challenges/create", {
      task_id: taskId,
    });
    return data;
  };

  goLive = async (taskId: string) => {
    const { data } = await this.authWorker.post("/tasks/go-live", {
      task_id: taskId,
    });
    return data;
  };

  rejectChallangeFromUser = async (challenge_id: string) => {
    const { data } = await this.authWorker.post("/challenges/reject", {
      challenge_id: challenge_id,
    });

    return data;
  };

  acceptChallange = async (challengeId: string) => {
    const { data } = await this.authWorker.post("/challenges/accept", {
      challenge_id: challengeId,
    });
    return data;
  };

  challangeUser = async (userId: string, taskId: string) => {
    const { data } = await this.authWorker.post("/challenges/create", {
      target_user_id: userId,
      task_id: taskId,
    });
    return data;
  };

  getPublicChallenges = async () => {
    const { data } = await this.authWorker.get("/challenges/public-challenges");
    return data;
  };

  getFriendsFeed = async (page: number, pageSize: number) => {
    const { data } = await this.authWorker.get("/friends/friends-tasks", {
      params: {
        page,
        page_size: pageSize,
      },
    });
    return data as FriendFeedItem[];
  };

  getAdminApprovals = async (taskId: string, page: number) => {
    const { data } = await this.authWorker.get("/admin-panel/verifications", {
      params: { task_id: taskId, page },
    });
    return data;
  };

  blockUser = async (userId: string) => {
    const { data } = await this.authWorker.post("/user/block/" + userId);
    return data;
  };

  reportTask = async (taskId: string) => {
    const { data } = await this.authWorker.post("/user/report/" + taskId);
    return data;
  };

  getBlockedUsers = async () => {
    const { data } = await this.authWorker.get("/friends/blocked");
    return data as User[];
  };

  unblockUser = async (userId: string) => {
    const { data } = await this.authWorker.post("/user/unblock/" + userId);
    return data;
  };
  getNotificationsPaginated = async ({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) => {
    const { data } = await this.authWorker.get<NotificationResponse[]>(
      "/notifications",
      {
        params: {
          page,
          page_size: pageSize,
        },
      }
    );
    return {
      page,
      data,
    };
  };

  getLikeCount = async (verificationId: string) => {
    const { data } = await this.authWorker.get(
      `/live-actions/verification-likes/${verificationId}`
    );
    return data as { likes_count: number; has_liked: boolean };
  };

  likeVerification = async (verificationId: string) => {
    const { data } = await this.authWorker.post(
      `/live-actions/like-verification/${verificationId}`
    );
    return data;
  };

  unlikeVerification = async (verificationId: string) => {
    const { data } = await this.authWorker.delete(
      `/live-actions/unlike-verification/${verificationId}`
    );
    return data;
  };

  getUnreadNotificationsCount = async () => {
    const { data } = await this.authWorker.get("/notifications/unread-count");
    return data as { count: number };
  };

  markNotificationsAsRead = async () => {
    const { data } = await this.authWorker.post("/notifications/mark-read");
    return data;
  };

  publishPost = async (taskId: string, content: string) => {
    const { data } = await this.authWorker.post("/tasks/publish-post", {
      task_id: taskId,
      content,
    });
    return data;
  };

  getChatRooms = async () => {
    const { data } = await this.authWorker.get<{ chat_rooms: ChatRoom[] }>(
      "/chat/chat-rooms"
    );
    return data.chat_rooms;
  };

  sendPublicKey = async (targetUserId: string, publicKey: string) => {
    const { data } = await this.authWorker.post("/chat/send-public-key", {
      user_id: targetUserId,
      public_key: publicKey,
    });
    return data;
  };
}

export default new ApiClient();
