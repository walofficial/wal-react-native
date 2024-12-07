import React from "react";
import { LocationFeedPost } from "@/lib/interfaces";
import { convertToCDNUrl, getVideoSrc } from "@/lib/utils";
import { useIsFocused } from "@react-navigation/native";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import ka from "date-fns/locale/ka";
import { useAtomValue } from "jotai";
import { HEADER_HEIGHT } from "@/lib/constants";
import FeedItem from "../FeedItem";
import useAuth from "@/hooks/useAuth";
import useTask from "@/hooks/useTask";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export default function ListUserGeneratedItem({
  item,
  shouldPlay,
  itemHeight,
  feedItemProps = {},
}: {
  item: LocationFeedPost;
  shouldPlay: boolean;
  shouldPreload: boolean;
  itemHeight: number;
  feedItemProps?: any;
}) {
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const headerHeight = useAtomValue(HEADER_HEIGHT);
  const { task } = useTask(item.task_id);
  const { data: pinnedVerification, isFetching } = useQuery({
    queryKey: ["pinned-feed-item", item.task_id],
    queryFn: () => api.getPinnedFeedItem(item.task_id),
  });

  const { verified_image, last_modified_date } = item;
  const mediaSource = getVideoSrc(item);
  const canPin = task?.can_pin_user_ids.includes(user.id);

  return (
    <FeedItem
      affiliatedIcon={item.assignee_user?.affiliated?.icon_url}
      name={item.assignee_user?.username || user.username}
      time={last_modified_date}
      imageUrl={verified_image ? convertToCDNUrl(verified_image) : ""}
      videoUrl={mediaSource ? convertToCDNUrl(mediaSource) : ""}
      verificationId={item.id}
      avatarUrl={
        item.assignee_user?.photos[0]?.image_url[0] ||
        user.photos[0]?.image_url[0]
      }
      text={item.text_content}
      isVisible={shouldPlay && isFocused}
      itemHeight={itemHeight}
      headerHeight={headerHeight}
      friendId={item.assignee_user?.id || user.id}
      isStory={true}
      isPublic={item.is_public}
      canPin={canPin}
      isPinned={pinnedVerification?.id === item.id}
      {...feedItemProps}
    />
  );
}
