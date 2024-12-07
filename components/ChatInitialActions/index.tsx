import React from "react";
import { View, ViewabilityConfigCallbackPairs } from "react-native";

import useAuth from "@/hooks/useAuth";
import TakePhoto from "./TakePhoto";
import TakeVideo from "./TakeVideo";
import SentMediaItem from "./sent-media-item";
import useUserChat from "@/hooks/useUserChat";
import { useLocalSearchParams } from "expo-router";
import { Large, Small } from "../ui/typography";
import MessageCompletedTaskItem from "../MessageCompletedTaskItem";

export default function ChatInitialActions() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();

  const { match, isFetching } = useUserChat(matchId, false);
  const assigneTaskTitle =
    match?.assigned_task?.display_name || "(Untitled Task)";

  const assignedTaskDescription = match?.assigned_task?.task_description;
  const matchUserHasVerified = match?.task_completer_user_ids?.includes(
    match.target_user.id
  );

  if (!match) {
    return null;
  }

  const userHasVerified =
    match?.task_completer_user_ids?.includes(user.id) || false;

  return (
    <>
      <SentMediaItem
        isAuthor={false}
        currentUser={user}
        selectedUser={match.target_user}
        content={
          <Large className="bg-gray-200 dark:bg-gray-800 p-3 rounded-md overflow-hidden text-white">
            {assigneTaskTitle}
          </Large>
        }
      />
      <SentMediaItem
        isAuthor={false}
        currentUser={user}
        selectedUser={match.target_user}
        content={
          <Large className="bg-gray-200 dark:bg-gray-800 p-3 rounded-md overflow-hidden text-white">
            {assignedTaskDescription}
          </Large>
        }
      />

      {matchUserHasVerified && (
        <SentMediaItem
          isAuthor={false}
          currentUser={user}
          selectedUser={match.target_user}
          content={
            <View className="flex flex-col items-start">
              <Large className="bg-gray-200 mb-3 dark:bg-gray-800 p-3 rounded-md overflow-hidden text-white">
                {"მე გავაკეთე უკვე"}
              </Large>
              <MessageCompletedTaskItem
                matchId={matchId as string}
                userId={match.target_user.id}
                enabled={!!match && !!matchUserHasVerified}
              />
            </View>
            // <TouchableOpacity
            //   onPress={() =>
            //     SheetManager.show("user-sent-media-sheet", {
            //       payload: {
            //         userId: match.target_user.id,
            //         matchId: matchId,
            //       },
            //     })
            //   }
            // >
            //   {match.assigned_task.task_verification_media_type === "video" ? (
            //     <View className="w-16 h-16 rounded-full shadow-md bg-gray-100 flex items-center justify-center">
            //       <VideoIcon size={40} className="w-10 h-10 text-gray-600" />
            //     </View>
            //   ) : (
            //     <View className="w-16 h-16 rounded-full shadow-md bg-gray-100 flex items-center justify-center">
            //       <ImageIcon className="w-6 h-6 text-gray-600" />
            //     </View>
            //   )}
            // </TouchableOpacity>
          }
        />
      )}
      {userHasVerified && (
        <SentMediaItem
          isAuthor
          selectedUser={user}
          currentUser={user}
          content={
            <MessageCompletedTaskItem
              matchId={matchId as string}
              userId={user.id}
              enabled={!!match && !!userHasVerified}
            />
          }
        />
      )}
      {userHasVerified && !matchUserHasVerified && (
        <SentMediaItem
          isAuthor={false}
          currentUser={user}
          selectedUser={match.target_user}
          content={
            <Large className="bg-gray-200 dark:bg-gray-800 p-3 rounded-md Large-white">
              ახლა ჩემი ჯერია 😊
            </Large>
          }
        />
      )}
      {!userHasVerified && (
        <SentMediaItem
          isAuthor
          selectedUser={user}
          currentUser={user}
          content={<TakeVideo />}
        />
      )}
      {/* {!userHasVerified && verificationStatus?.text && ( */}
    </>
  );
}
