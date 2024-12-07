import React, { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SheetManager } from "react-native-actions-sheet";
import FriendRequests from "../ContactSyncSheet/FriendRequests";
import { HEADER_HEIGHT } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";

function AddFriendsView() {
  const queryClient = useQueryClient();
  const headerHeight = HEADER_HEIGHT;
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Implement your refresh logic here
    // For example, you might want to refetch friend requests
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
    queryClient.invalidateQueries({ queryKey: ["friendsFeed"] });
  }, []);

  return (
    <ScrollView
      style={{
        flexGrow: 1,
        paddingTop: headerHeight,
        paddingHorizontal: 40,
        paddingBottom: 40,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="flex-1 items-center">
        <Text className="text-xl text-center mb-4 text-gray-300">
          დაამატეთ თქვენი მეგობრები მათი კონტენტის სანახავად
        </Text>
        <TouchableOpacity
          className="bg-blue-600 w-full mt-3 py-3 px-6 rounded-full flex-row items-center justify-center"
          onPress={() => {
            SheetManager.show("contact-sync-sheet");
          }}
        >
          <Ionicons name="people-outline" size={24} color="white" />
          <Text className="text-white text-lg font-semibold ml-2">
            დაამატე მეგობრები
          </Text>
        </TouchableOpacity>
        <View className="mt-8">
          <FriendRequests hideMyRequests limit={3} />
        </View>
      </View>
    </ScrollView>
  );
}

export default AddFriendsView;
