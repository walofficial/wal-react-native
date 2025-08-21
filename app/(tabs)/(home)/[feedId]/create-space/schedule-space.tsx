// @ts-nocheck
import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import DatePicker from "react-native-date-picker";
import { useLocalSearchParams, router, useRouter } from "expo-router";
import { useCreateSpace } from "@/hooks/useCreateSpace";
import CustomAnimatedButton from "@/components/ui/AnimatedButton";

export default function ScheduleSpace() {
  const [open, setOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { feedId, description } = useLocalSearchParams<{
    feedId: string;
    description: string;
  }>();
  const router = useRouter();

  const { mutate: createSpace, isPending } = useCreateSpace();

  const handleSchedule = () => {
    createSpace({
      description: description,
      feedId: feedId,
      scheduled_at: selectedDate.toISOString(),
    });
  };

  return (
    <View style={styles.container}>
      <DatePicker
        title="ოთახის დაწყების დრო"
        buttonColor="white"
        mode="datetime"
        locale="en"
        theme="dark"
        confirmText="Confirm"
        cancelText="Cancel"
        open={open}
        minimumDate={new Date()}
        maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
        date={selectedDate}
        onDateChange={(date) => {
          setOpen(false);
          setSelectedDate(date);
        }}
        onCancel={() => {
          setOpen(false);
          router.back();
        }}
      />

      {/* Schedule Button */}
      <CustomAnimatedButton
        style={{
          backgroundColor: "#2563eb",
          width: "100%",
          paddingVertical: 16,
          borderRadius: 9999,
          marginTop: 16,
        }}
        variant="default"
        size="lg"
        onPress={handleSchedule}
        disabled={isPending}
        isLoading={isPending}
        loadingColor="black"
      >
        <Text style={{ color: "#333", textAlign: "center", fontWeight: "600" }}>
          {isPending ? "მუშავდება..." : "ოთახის ჩანიშვნა"}
        </Text>
      </CustomAnimatedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    padding: 16,
  },
});
