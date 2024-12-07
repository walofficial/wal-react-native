import React, { useEffect, useRef, useState } from "react";
import { View, Animated } from "react-native";
import { UserCardItem } from "@/components/UserCardItem";
import UsersNotFound from "@/components/UsersNotFound";
import ErrorMessageCard from "@/components/ErrorMessageCard";
import { queryClient } from "@/lib/queryClient";
import { useNextFeedBatch } from "@/hooks/useNextFeedBatch";
import { useUserCardActions } from "@/hooks/useUserCardActions";
import { FeedUser, User } from "@/lib/interfaces";
import ActionButtons from "@/components/UserCardItem/ActionButton";
import UserTaskNotFound from "@/components/UserTaskNotFound";
import useAuth from "@/hooks/useAuth";
import { Skeleton } from "../ui/skeleton";
import {
  CARD_HEIGHT_STYLE_PROMPT,
  CARD_MIN_HEIGHT,
  MAX_CARD_HEIGHT_STYLE_PROP,
} from "@/lib/utils";
import ScreenLoader from "../ScreenLoader";

const FETCH_THRESHOLD = 2;

export default function Feed() {
  const {
    currentIndex,
    currentUsers,
    setCurrentIndex,
    initialLoad,
    isFetching,
    fetchUsers,
    isUsersFetchError,
    error,
  } = useNextFeedBatch();
  const { user } = useAuth();

  const currentUser = currentUsers[currentIndex] as FeedUser;
  const hasTask = !!user.selected_task;
  const pressCount = useRef(0);

  const { like, dislike } = useUserCardActions({
    currentUser,
    onButtonPress: () => {
      setIsAnimating(true);
      // Reduce button opacity
      Animated.timing(buttonOpacity, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }).start();

      // Start fade-out animation for the card
      setAnimatingUser(currentUser);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After fade-out, update the index and reset animation
        pressCount.current += 1;
        queryClient.setQueryData(["user-explore"], (current: User[]) => {
          return current.map((item) => {
            if (item.id === currentUser.id) {
              return {
                ...item,
                is_swiped: true,
              };
            } else {
              return item;
            }
          });
        });
        const correctIndex = queryClient
          .getQueryData(["user-explore"])
          .findIndex((user: User, idx) => {
            return !user.is_swiped && idx > currentIndex;
          });

        setCurrentIndex(correctIndex);
        setAnimatingUser(null);
        fadeAnim.setValue(1);
        setIsAnimating(false);
        // Reset button opacity
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      });
    },
    onRejectSuccess: () => {
      if (pressCount.current >= FETCH_THRESHOLD) {
        fetchUsers();
        pressCount.current = 0;
      }
    },
    onLikeSuccess: () => {
      if (pressCount.current >= FETCH_THRESHOLD) {
        fetchUsers();
        pressCount.current = 0;
      }
    },
  });

  const [currentUserIndex, setCurrentUserIndex] = useState(currentIndex);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [animatingUser, setAnimatingUser] = useState<FeedUser | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentIndex !== currentUserIndex && !animatingUser) {
      setCurrentUserIndex(currentIndex);
    }
  }, [currentIndex, currentUserIndex, animatingUser]);

  useEffect(() => {
    if (currentUser?.is_swiped) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentUser?.is_swiped, currentIndex]);

  if (currentUser?.is_swiped) {
    return <ErrorMessageCard title="User already swiped, please wait" />;
  }
  if (isUsersFetchError) {
    return <ErrorMessageCard title="System error, try again later" />;
  }
  if (!hasTask) {
    return <UserTaskNotFound />;
  }

  if (!currentUsers.length && !isFetching) {
    return <UsersNotFound />;
  }

  const showReactButtons =
    currentUsers.length !== 0 &&
    currentIndex !== currentUsers.length &&
    currentIndex <= currentUsers.length;

  const nextUser = currentUsers[currentIndex + 1];

  const showLoader = isFetching && initialLoad && currentUsers.length === 0;

  return (
    <>
      {showLoader && (
        <Skeleton
          style={{
            minHeight: CARD_MIN_HEIGHT,
            height: CARD_HEIGHT_STYLE_PROMPT,
            maxHeight: MAX_CARD_HEIGHT_STYLE_PROP,
          }}
        />
      )}
      {isFetching && !currentUser && !showLoader && <ScreenLoader />}
      {currentUser || animatingUser ? (
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          <UserCardItem
            key={animatingUser ? animatingUser.id : currentUser.id}
            currentUser={animatingUser || currentUser}
          />
        </Animated.View>
      ) : (
        !showLoader && !isFetching && <UsersNotFound />
      )}
      {showReactButtons && currentUser && (
        <Animated.View style={{ opacity: buttonOpacity }}>
          <ActionButtons
            onDislike={dislike}
            onLike={like}
            disabled={isAnimating}
          />
        </Animated.View>
      )}
    </>
  );
}
