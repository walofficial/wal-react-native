// @ts-nocheck
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, router, useRouter } from 'expo-router';
import { useCreateSpace } from '@/hooks/useCreateSpace';
import CustomAnimatedButton from '@/components/ui/AnimatedButton';

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
      {open && (
        <DateTimePicker
          value={selectedDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
          onChange={(event, date) => {
            if (Platform.OS === 'android') {
              if (event.type === 'set' && date) {
                setSelectedDate(date);
                setOpen(false);
              } else {
                setOpen(false);
                router.back();
              }
            } else {
              if (date) setSelectedDate(date);
            }
          }}
        />
      )}

      {/* iOS cancel button to mimic previous cancel behavior */}
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          onPress={() => {
            setOpen(false);
            router.back();
          }}
          style={{ marginTop: 12 }}
        >
          <Text style={{ color: '#aaa' }}>Cancel</Text>
        </TouchableOpacity>
      )}

      {/* Schedule Button */}
      <CustomAnimatedButton
        style={{
          backgroundColor: '#2563eb',
          width: '100%',
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
        <Text style={{ color: '#333', textAlign: 'center', fontWeight: '600' }}>
          {isPending ? 'მუშავდება...' : 'ოთახის ჩანიშვნა'}
        </Text>
      </CustomAnimatedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 16,
  },
});
