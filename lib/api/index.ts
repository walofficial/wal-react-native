/* eslint-disable no-debugger */
//@ts-ignore

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosRequestHeaders,
} from "axios";
import { API_BASE_URL } from "./config";
import { createUploadTask, FileSystemUploadType } from "expo-file-system";

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
  ProfileInformationResponse,
  CreateSpaceResponse,
  GetRoomPreviewResponse,
  NewsItemResponse,
  FactCheckResponse,
} from "@/lib/interfaces";
import { supabase } from "../supabase";
import ProtocolService from "../services/ProtocolService";
import { isWeb } from "../platform";
import { CompressedVideo } from "../media/video/types";
import { Contact } from "expo-contacts";

export class ApiClient {
  supabaseUserToken?: string;

  thebackend: AxiosInstance;

  constructor() {
    supabase.auth.onAuthStateChange((_event, session) => {
      this.supabaseUserToken = session?.access_token;
      this.updateAxiosInstancesWithToken();
    });
    this.thebackend = this.createAxiosInstance(API_BASE_URL);
  }

  createAxiosInstance(
    baseURL: string,
    useCustomInterceptor: boolean = true
  ): AxiosInstance {
    const instance = axios.create({
      baseURL,
      headers: {
        "x-is-anonymous": isWeb,
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
      } as AxiosRequestHeaders;
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
      this.thebackend.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${this.supabaseUserToken}`;
    } else {
      delete this.thebackend.defaults.headers.common["Authorization"];
    }
  }

  resetToken() {
    this.supabaseUserToken = undefined;
    this.updateAxiosInstancesWithToken();
  }

  getUser = async (): Promise<User> => {
    const response = await this.thebackend.get("/user/get-user");

    return response.data;
  };

  getUserVerifications = async (
    targetUserId: string,
    page: number,
    pageSize: number = 10
  ) => {
    try {
      const { data } = await this.thebackend.get<LocationFeedPost[]>(
        "/user/get-verifications",
        {
          params: {
            page,
            page_size: pageSize,
            target_user_id: targetUserId,
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
    const { data } = await this.thebackend.post("/check-access-code", {
      code,
    });
    return data;
  };

  getAccess = async () => {
    const { data } = await this.thebackend.get("/access/list-access-codes");
    return data as {
      codes: string[];
    };
  };

  inviteUserToMent = async (targetPhoneNumber: string): Promise<null> => {
    const { data } = await this.thebackend.post("/access/send-access-code", {
      targetPhoneNumber,
    });

    return data;
  };

  updateMessages = async (messages: { id: string; state: string }[]) => {
    if (messages.some((message) => !message.id)) {
      throw new Error("All messages must have an id");
    }
    await this.thebackend.post("/chat/update-messages", {
      messages,
    });
  };
  fetchMessages = async (
    page: number | boolean,
    page_size: number,
    room_id: string,
    localUserId: string
  ) => {
    if (!page) {
      throw new Error("Fetched all pages");
    }

    const { data } = await this.thebackend.get(`/chat/messages`, {
      params: {
        room_id,
        page: page,
        page_size,
      },
    });

    let decryptedMessages: ChatMessages = [];
    try {
      const processedMessages = await Promise.all(
        data.messages.map(async (message: ChatMessage) => {
          try {
            if (message.encrypted_content && message.nonce) {
              let decryptedMessage = "";

              decryptedMessage = await ProtocolService.decryptMessage(
                localUserId === message.author_id
                  ? message.recipient_id
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
            // console.error(
            //   `Failed to decrypt message ${message.id}:`,
            //   decryptError
            // );
            return null; // Return null for failed messages
          }
        })
      );

      // Filter out null values from failed decryption attempts
      decryptedMessages = processedMessages.filter(
        (msg): msg is ChatMessage => msg !== null
      );
    } catch (error) {
      console.error("Error processing messages", error);
      decryptedMessages = data.messages
        .map((message: ChatMessage) => {
          if (message.encrypted_content) {
            return null;
          }
          return {
            ...message,
            message: message.message,
          };
        })
        .filter((msg: ChatMessage): msg is ChatMessage => msg !== null);
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
    const response = await this.thebackend.put("/user/update", data);

    return response;
  };

  createUser = async (data: any) => {
    const { data: newUser } = await this.thebackend.post(
      "/user/create-user",
      data
    );

    return newUser;
  };

  getSingleTaskById = async (taskId: string): Promise<Task> => {
    const { data } = await this.thebackend.get(`/tasks/single/${taskId}`);
    return data as Task;
  };

  getTask = async (): Promise<Task> => {
    if (!this.supabaseUserToken) {
      throw new Error("no token");
    }
    const { data } = await this.thebackend.get("/user/task");
    return data as Task;
  };

  updateUserVerificationVisibility = async (
    verificationId: string,
    isPublic: boolean
  ) => {
    const { data } = await this.thebackend.post(
      "/user/update-verification-visibility",
      {
        verification_id: verificationId,
        is_public: isPublic,
      }
    );
    return data as UserVerification[];
  };

  getMessageRoom = async (roomId: string): Promise<ChatRoom> => {
    const { data } = await this.thebackend.get(`/chat/message-chat-room`, {
      params: { room_id: roomId },
    });
    if (data.user_public_key) {
      await ProtocolService.storeRemotePublicKey(
        data.target_user_id,
        data.user_public_key
      );
    }
    return data as ChatRoom;
  };

  createRoom = async (targetUserId: string, keyBundle: any) => {
    const { data } = await this.thebackend.post("/chat/create-chat-room", {
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
    await this.thebackend.post("/user/create-task", data);
  };

  selectTask = async (task_id: string | null) => {
    const { data } = await this.thebackend.post("/user/select-task", {
      task_id,
    });

    return data.task;
  };

  getCity = async (latitude: any, longitude: any) => {
    const { data } = await this.thebackend.post("/user/location", {
      latitude,
      longitude,
    });

    return data;
  };

  uploadPhotos = async (formData: any) => {
    const { data } = await this.thebackend.post("/upload-photos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  };

  trackImpression = async (verificationId: string) => {
    try {
      const { data } = await this.thebackend.post(
        `/live-actions/track-impressions/${verificationId}`
      );
      return data;
    } catch (error) {
      console.error("Failed to track impression", error);
      throw error;
    }
  };

  getVerificationImpressions = async (verificationId: string) => {
    const { data } = await this.thebackend.get(
      `/live-actions/get-impressions/${verificationId}`
    );
    return data;
  };

  fetchSuggestedInterests = async (interests: string[]) => {
    const { data } = await this.thebackend.post("/generate-interests", {
      chosen_interests: interests,
    });
    if (!data || !data.interests || !data.interests.length) {
      return ["Politics", "Traveling", "Gaming", "Dating"];
    }
    return data.interests;
  };

  generateRandomTasks = async ({ refetch }: { refetch: boolean }) => {
    const { data } = await this.thebackend.post("/tasks/random-tasks", {
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

    const { data } = await this.thebackend.get("/tasks/daily", {
      params: {
        category_id: categoryId,
      },
      headers,
    });

    return data as Task[];
  };

  isUserNameAvailable = async (username: string) => {
    const { data } = await this.thebackend.get(
      "/user/check-username/" + username
    );
    return data;
  };

  requestLive = async (taskId: string, text: string) => {
    const { data } = await this.thebackend.post("/live/request-live", {
      task_id: taskId,
      text_content: text,
    });
    return data as {
      livekit_token: string;
      room_name: string;
    };
  };

  getLiveStreamToken = async (roomName: string) => {
    const { data } = await this.thebackend.get("/live/get-live-stream-token", {
      params: {
        room_name: roomName,
      },
    });
    return data as {
      livekit_token: string;
      room_name: string;
    };
  };

  PUBLIC_fetchLocations = async (categoryId: string) => {
    const { data } = await this.thebackend.get("/tasks/public/locations", {
      params: {
        category_id: categoryId,
      },
    });

    return data;
  };

  fetchLocations = async (
    categoryId: string,
    coords?: { latitude: number; longitude: number },
    errorMsg?: string | null
  ): Promise<LocationsResponse> => {
    const headers: Record<string, string> = {};
    if (coords) {
      headers["x-user-location-latitude"] = coords.latitude.toString();
      headers["x-user-location-longitude"] = coords.longitude.toString();
    }
    const { data } = await this.thebackend.get("/tasks/locations", {
      params: {
        category_id: categoryId,
        ignore_location_check: !!errorMsg,
      },
      headers,
    });
    return data;
  };

  uploadTaskExamples = async (formData: any) => {
    const { data } = await this.thebackend.post(
      "/verification-example-media",
      formData
    );

    return data;
  };

  deleteTaskExample = async (values: { taskId: string; exampleId: string }) => {
    const { data } = await this.thebackend.delete(
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
    const { data } = await this.thebackend.post("/verify-photos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  };

  uploadPhotosToLocation = async (formData: any) => {
    const { data } = await this.thebackend.post(
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
      const { data } = await this.thebackend.post("/verify-videos", formData, {
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

  uploadVideosToLocation = (
    video: CompressedVideo,
    setProgress: (progress: number) => void,
    params: {
      task_id: string;
      recording_time: number;
      text_content: string;
    }
  ) => {
    return createUploadTask(
      API_BASE_URL + "verify-videos/upload-to-location",
      video.uri,
      {
        headers: {
          "content-type": video.mimeType,
          Authorization: `Bearer ${this.supabaseUserToken}`,
        },
        httpMethod: "POST",
        fieldName: "video_file",
        parameters: {
          task_id: params.task_id,
          recording_time: params.recording_time.toString(),
          text_content: params.text_content,
        },
        mimeType: video.mimeType,
        uploadType: FileSystemUploadType.MULTIPART,
      },
      (p) => setProgress(p.totalBytesSent / p.totalBytesExpectedToSend)
    );
  };
  public_getLocationFeedPaginated = async (taskId: string, page: number) => {
    const { data } = await this.thebackend.get<LocationFeedPost[]>(
      "/user/feed/public/location-feed/" + taskId,
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
  };

  getLocationFeedPaginated = async (taskId: string, page: number, contentTypeFilter?: string, searchTerm?: string) => {
    try {
      const { data } = await this.thebackend.get<LocationFeedPost[]>(
        "/user/feed/location-feed/" + taskId,
        {
          params: {
            page,
            content_type_filter: contentTypeFilter,
            search_term: searchTerm,
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
    const { data } = await this.thebackend.get<LocationFeedPost[]>(
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
    await this.thebackend.put("/user/upsert-fcm", {
      data: {
        expo_push_token: token,
      },
    });

    return true;
  };

  deleteFCMData = async (expoPushToken: string) => {
    await this.thebackend.delete("/user/delete-fcm", {
      data: {
        expo_push_token: expoPushToken,
      },
    });
    return true;
  };

  getFCMData = async () => {
    const { data } = await this.thebackend.get("/user/get-fcm");
    return data;
  };

  acceptUser = async (target_user_id: string) => {
    const { data } = await this.thebackend.post("/user/accept", {
      target_user_id,
    });

    return data;
  };

  rejectUser = async (target_user_id: string) => {
    const { data } = await this.thebackend.post("/user/reject", {
      target_user_id,
    });

    return data;
  };

  getMatches = async () => {
    const { data } = await this.thebackend.get("/user/matches");

    return data as Match[];
  };

  pokeLiveUser = async (userId: string) => {
    const { data } = await this.thebackend.post("/live-actions/poke/" + userId);
    return data;
  };

  getUserVerification = async (taskId: string, userId?: string) => {
    const { data } = await this.thebackend.get("/user/get-verification", {
      params: {
        task_id: taskId,
        user_id: userId,
      },
    });

    return data;
  };

  getPinnedFeedItem = async (taskId: string) => {
    const { data } = await this.thebackend.get("/get_pinned_verification", {
      params: {
        task_id: taskId,
      },
    });

    return data;
  };

  pinFeedItem = async (taskId: string, verificationId: string) => {
    const { data } = await this.thebackend.post("/pin_verification", {
      task_id: taskId,
      verification_id: verificationId,
    });
    return data;
  };

  removePinnedFeedItem = async (taskId: string, verificationId: string) => {
    const { data } = await this.thebackend.delete("/pin_verification", {
      params: {
        task_id: taskId,
      },
    });
    return data;
  };

  getPublicVerificationById = async (verificationId: string) => {
    const { data } = await this.thebackend.get(
      "/user/public/get-verification",
      {
        params: {
          verification_id: verificationId,
        },
      }
    );
    return data as LocationFeedPost;
  };

  getCountryFeed = async () => {
    const { data } = await this.thebackend.get("/tasks/get-country-feed");

    return data as Task;
  };

  getVerificationById = async (verificationId: string) => {
    try {
      const { data } = await this.thebackend.get("/user/get-verification", {
        params: {
          verification_id: verificationId,
        },
      });
      return data as LocationFeedPost;
    } catch (error) {
      console.error("Error fetching verification by ID:", error);
      throw error;
    }
  };

  getFactCheck = async (verificationId: string): Promise<FactCheckResponse> => {
    try {
      const response = await this.thebackend.get(
        `/live-actions/fact-check/${verificationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching fact-check data:", error);
      throw error;
    }
  };

  rateFactCheck = async (verificationId: string) => {
    const { data } = await this.thebackend.post(
      `/live-actions/rate-fact-check/${verificationId}`
    );
    return data;
  };

  unrateFactCheck = async (verificationId: string) => {
    const { data } = await this.thebackend.delete(
      `/live-actions/unrate-fact-check/${verificationId}`
    );
    return data;
  };

  getCuratedFeedPaginated = async (
    taskId: string,
    page: number,
    pageSize: number = 10,
    contentTypeFilter?: "youtube_only" | "social_media_only"
  ): Promise<{ page: number; data: LocationFeedPost[] }> => {
    try {
      const { data } = await this.thebackend.get<LocationFeedPost[]>(
        `/user/feed/curated/${taskId}`,
        {
          params: {
            page,
            page_size: pageSize,
            content_type_filter: contentTypeFilter,
          },
        }
      );

      return {
        page,
        data,
      };
    } catch (error) {
      console.error(
        `Error fetching curated feed for taskId: ${taskId}, page: ${page}, pageSize: ${pageSize}`,
        error
      );
      return {
        page,
        data: [],
      };
    }
  };

  startPromo = async (matchId: string) => {
    const { data } = await this.thebackend.post("/user/promotion", {
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

    const { data } = await this.thebackend.get(
      "/tasks/daily-tasks-categories",
      { headers }
    );
    return data.filter((category: TaskCategory) => !category.hidden);
  };

  signup = async (values: any) => { };

  deleteUser = async () => {
    const { data } = await this.thebackend.delete("/user/delete");
    return data;
  };

  checkRegisteredUsers = async (contactsToCheck: Contact[]) => {
    const phoneNumbers = contactsToCheck
      .flatMap(
        (contact) =>
          contact.phoneNumbers?.map(
            (phoneNumber: { number?: string }) => phoneNumber.number
          ) || []
      )
      .filter((number): number is string => typeof number === 'string');
    const { data } = await this.thebackend.post(
      "/user/check_registered_users",
      {
        phone_numbers: phoneNumbers,
      }
    );

    return data;
  };

  getFriendRequests = async () => {
    const { data } = await this.thebackend.get("/friends/requests");
    return data as { user: User; request: FriendRequest }[];
  };

  sendFriendRequest = async (userId: string) => {
    const response = await this.thebackend.post("/friends/request", {
      target_user_id: userId,
    });

    if (!response.data) {
      throw new Error("Failed to send friend request");
    }

    return response.data;
  };

  acceptFriendRequest = async (requestId: string) => {
    const { data } = await this.thebackend.put(
      `/friends/request/${requestId}/accept`
    );
    return data;
  };

  rejectFriendRequest = async (requestId: string) => {
    const { data } = await this.thebackend.put(
      `/friends/request/${requestId}/reject`
    );
    return data;
  };

  getFriendsList = async (page: number, pageSize: number) => {
    const { data } = await this.thebackend.get("/friends/list", {
      params: {
        page,
        page_size: pageSize,
      },
    });
    return data as User[];
  };

  deleteFriend = async (friendId: string) => {
    const { data } = await this.thebackend.delete(
      `/friends/remove/${friendId}`
    );
    return data;
  };

  getAnonListForTask = async (taskId: string) => {
    const { data } = await this.thebackend.get("/tasks/anon-list", {
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
    const { data } = await this.thebackend.get("/tasks/anon-list/count", {
      params: {
        task_id: taskId,
      },
    });
    return (data?.count || 0) as number;
  };

  getMyChallangeRequests = async (): Promise<ChallangeRequest[]> => {
    try {
      const { data } = await this.thebackend.get("/challenges/my-requests");
      return data as ChallangeRequest[];
    } catch (error) {
      console.log("error", error);
      return [];
    }
  };

  getRatingForTask = async (taskId: string) => {
    const { data } = await this.thebackend.get(
      "/user/feed/check-task-rating/" + taskId
    );
    return data;
  };

  rateTask = async (
    taskId: string,
    rate_type: "like" | "dislike" | "close"
  ) => {
    try {
      const { data } = await this.thebackend.post(
        "/user/feed/rate-task/" + taskId,
        {
          rate_type,
        }
      );
      return data;
    } catch (error: any) {
      console.log("error", JSON.stringify(error.response?.data));
      throw error;
    }
  };

  checkLocation = async (
    taskId: string,
    latitude: number,
    longitude: number
  ) => {
    try {
      const { data } = await this.thebackend.get("/tasks/check-location", {
        params: {
          task_id: taskId,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        },
      });
      return data as CheckLocationResponse;
    } catch (error: unknown) {
      console.log(
        "error",
        error && typeof error === "object" && "response" in error
          ? JSON.stringify((error as any).response.data)
          : "Unknown error"
      );
      throw error;
    }
  };

  goLive = async (taskId: string) => {
    const { data } = await this.thebackend.post("/tasks/go-live", {
      task_id: taskId,
    });
    return data;
  };

  blockUser = async (userId: string) => {
    const { data } = await this.thebackend.post("/user/block/" + userId);
    return data;
  };

  reportTask = async (taskId: string) => {
    const { data } = await this.thebackend.post("/user/report/" + taskId);
    return data;
  };

  getBlockedUsers = async () => {
    const { data } = await this.thebackend.get("/friends/blocked");
    return data as User[];
  };

  unblockUser = async (userId: string) => {
    const { data } = await this.thebackend.post("/user/unblock/" + userId);
    return data;
  };
  getNotificationsPaginated = async ({
    page,
    pageSize,
  }: {
    page: number;
    pageSize: number;
  }) => {
    const { data } = await this.thebackend.get<NotificationResponse[]>(
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
    const { data } = await this.thebackend.get(
      `/live-actions/verification-likes/${verificationId}`
    );
    return data as { likes_count: number; has_liked: boolean };
  };

  likeVerification = async (verificationId: string) => {
    const { data } = await this.thebackend.post(
      `/live-actions/like-verification/${verificationId}`
    );
    return data;
  };

  unlikeVerification = async (verificationId: string) => {
    const { data } = await this.thebackend.delete(
      `/live-actions/unlike-verification/${verificationId}`
    );
    return data;
  };

  getUnreadNotificationsCount = async () => {
    const { data } = await this.thebackend.get("/notifications/unread-count");
    return data as { count: number };
  };

  markNotificationsAsRead = async () => {
    const { data } = await this.thebackend.post("/notifications/mark-read");
    return data;
  };

  publishPost = async (taskId: string, formData: FormData | string) => {
    const { data } = await this.thebackend.post(
      "/tasks/publish-post",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  };
  searchByUsername = async (username: string) => {
    const { data } = await this.thebackend.get(
      `/user/profile/username/${username}`
    );
    return data;
  };
  getChatRooms = async (localUserId: string) => {
    const { data } = await this.thebackend.get<{ chat_rooms: ChatRoom[] }>(
      "/chat/chat-rooms"
    );

    // Save the message author ids public key before trying to decrypt.
    // Note that this happens in other casess too. search for storeRemotePublicKey
    await data.chat_rooms.map(async (room) => {
      return await ProtocolService.storeRemotePublicKey(
        room.last_message.author_id,
        room.user_public_key
      );
    });

    const decryptedRooms = await Promise.all(
      data.chat_rooms.map(async (room) => ({
        ...room,
        last_message: {
          ...room.last_message,
          message: await ProtocolService.decryptMessage(
            localUserId === room.last_message.author_id
              ? room.last_message.recipient_id
              : room.last_message.author_id,
            {
              encryptedMessage: room.last_message.encrypted_content,
              nonce: room.last_message.nonce,
            }
          ),
        },
      }))
    );
    return decryptedRooms;
  };

  sendPublicKey = async (targetUserId: string, publicKey: string) => {
    const { data } = await this.thebackend.post("/chat/send-public-key", {
      user_id: targetUserId,
      public_key: publicKey,
    });
    return data;
  };

  getProfileInformation = async (
    userId: string
  ): Promise<ProfileInformationResponse> => {
    const { data } = await this.thebackend.get(`/user/profile/${userId}`);
    return data;
  };

  getRoomPreview = async (livekit_room_name: string) => {
    const { data } = await this.thebackend.get<GetRoomPreviewResponse>(
      `/space/preview/${livekit_room_name}`
    );
    return data;
  };

  subscribeToSpace = async (livekitRoomName: string) => {
    const { data } = await this.thebackend.post(`/space/subscribe-space`, {
      livekit_room_name: livekitRoomName,
    });
    return data;
  };

  startStream = async (livekitRoomName: string) => {
    const { data } = await this.thebackend.post(`/space/create-stream`, {
      livekit_room_name: livekitRoomName,
    });
    return data as {
      livekit_room_name: string;
      livekit_token: string;
    };
  };

  joinSpace = async (livekitRoomName: string) => {
    const { data } = await this.thebackend.post(`/space/join-stream`, {
      livekit_room_name: livekitRoomName,
    });
    return data as {
      livekit_room_name: string;
      livekit_token: string;
    };
  };

  stopStream = async (livekit_room_name: string) => {
    const { data } = await this.thebackend.post(`/space/stop-stream`, {
      livekit_room_name: livekit_room_name,
    });
    return data;
  };

  createSpace = async (data: {
    text_content: string;
    task_id: string;
    scheduled_at?: string;
  }) => {
    const { data: response } = await this.thebackend.post<CreateSpaceResponse>(
      "/space/create-space",
      data
    );
    return response;
  };

  removeFromStage = async (
    livekit_room_name: string,
    participant_identity: string
  ) => {
    const { data } = await this.thebackend.post(`/space/remove-from-stage`, {
      livekit_room_name,
      participant_identity,
    });
    return data;
  };

  inviteToStage = async (
    livekit_room_name: string,
    participant_identity: string
  ) => {
    const { data } = await this.thebackend.post(`/space/invite-to-stage`, {
      livekit_room_name,
      participant_identity,
    });
    return data;
  };

  raiseHand = async (livekit_room_name: string) => {
    const { data } = await this.thebackend.post(`/space/raise-hand`, {
      livekit_room_name,
    });
    return data;
  };
  getNews = async () => {
    // Simulate API delay
    const { data } = await this.thebackend.get<NewsItemResponse>(`/news`);
    return data.news;
  };

  getNewsById = async (newsId: string) => {
    const { data } = await this.thebackend.get<NewsItemResponse>(
      `/news/${newsId}`
    );
    return data;
  };

  getNewsComments = async (newsId: string) => {
    const response = await this.thebackend.get(`/news/${newsId}/comments`);
    return response.data;
  };

  deleteComment = async (commentId: string) => {
    const { data } = await this.thebackend.delete(`/comments/${commentId}`);
    return data;
  };

  // Comment-related endpoints
  createComment = async (data: {
    content: string;
    verification_id: string;
    parent_comment_id?: string;
    tags?: Array<{ user_id: string; username: string }>;
  }) => {
    const { data: response } = await this.thebackend.post("/comments", data);
    return response;
  };

  getVerificationComments = async (
    verificationId: string,
    sortBy: "recent" | "top" = "recent",
    page: number = 1,
    limit: number = 20
  ) => {
    const { data } = await this.thebackend.get(
      `/comments/verification/${verificationId}`,
      {
        params: {
          sort_by: sortBy,
          page,
          limit,
        },
      }
    );
    return data as {
      comment: {
        id: string;
        content: string;
        author_id: string;
        author: {
          id: string;
          username: string;
          avatar_url?: string;
        };
        verification_id: string;
        parent_comment_id: string | null;
        created_at: string;
        updated_at: string;
        likes_count: number;
        score: number;
        tags: Array<{
          user_id: string;
          username: string;
        }>;
        ai_analysis: Record<string, any>;
      };
      is_liked_by_user: boolean;
    }[];
  };

  likeComment = async (commentId: string) => {
    const { data } = await this.thebackend.post(`/comments/${commentId}/like`);
    return data;
  };

  unlikeComment = async (commentId: string) => {
    const { data } = await this.thebackend.delete(
      `/comments/${commentId}/like`
    );
    return data;
  };

  getVerificationCommentsCount = async (verificationId: string) => {
    const { data } = await this.thebackend.get(
      `/comments/verification/${verificationId}/count`
    );
    return data as { count: number };
  };

  // Comment reaction endpoints
  addReactionToComment = async (
    commentId: string,
    reactionType: string
  ) => {
    const { data } = await this.thebackend.post(
      `/comments/${commentId}/reactions`,
      { reaction_type: reactionType }
    );
    return data;
  };

  removeReactionFromComment = async (commentId: string) => {
    const { data } = await this.thebackend.delete(
      `/comments/${commentId}/reactions`
    );
    return data;
  };

  getCommentReactions = async (commentId: string) => {
    const { data } = await this.thebackend.get(
      `/comments/${commentId}/reactions`
    );
    return data;
  };

  getNewsFeed = async (taskId: string): Promise<LocationFeedPost[]> => {
    try {
      const { data } = await this.thebackend.get(`/user/feed/public/news-feed`);
      return data;
    } catch (error) {
      console.error("Error fetching news feed:", error);
      return [];
    }
  };

  getCountry = async (): Promise<{ country_code: string }> => {
    try {
      const { data } = await this.thebackend.get("/get-country");
      return data;
    } catch (error) {
      console.error("Error fetching country:", error);
      // Return a default country code if the request fails
      return { country_code: "GE" };
    }
  };
}

export default new ApiClient();
