import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreateSpace } from '@/hooks/useCreateSpace';
import { useOnboarding } from '@/hooks/useOnboardingContext';
import { useHaptics } from '@/lib/haptics';
import { FontSizes } from '@/lib/theme';
import CustomAnimatedButton from '@/components/ui/AnimatedButton';

export default function CreateSpace() {
  const [description, setDescription] = useState('');
  const { feedId } = useLocalSearchParams<{ feedId: string }>();
  const { onboardingState, markTutorialAsSeen } = useOnboarding();
  const { mutate: createSpace, isPending } = useCreateSpace();
  const haptic = useHaptics();
  const handleUnderstand = async () => {
    await haptic('Medium');
    await markTutorialAsSeen('hasSeenSpaceInfo');
  };

  return (
    <View style={[styles.container]}>
      {!onboardingState.hasSeenSpaceInfo ? (
        <>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>ოთახები WAL ზე</Text>

            <Text style={styles.subtitle}>
              "ოთახებში" შეგიძლიათ ლოკაციაზე ნებისმიერ ადამიანთან დისკუსია
              ხმოვან რეჟიმში.
            </Text>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons
                  name="globe-outline"
                  style={styles.icon}
                  size={24}
                  color="white"
                />
                <Text style={styles.infoText}>
                  ოთახები არის საჯარო და ყველას შეუძლია შემოსვლა.
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons
                  name="people-outline"
                  style={styles.icon}
                  size={24}
                  color="white"
                />
                <Text style={styles.infoText}>
                  შენ როგორც ოთახნის შექმნელს შეგიძლია მოიწვიო 10 მდე ადამიანი
                  სალაპარაკოდ.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.understandButton}
              onPress={handleUnderstand}
            >
              <Text style={styles.buttonText}>კარგი</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="რაზე აპირებ ლაპარაკს?"
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
              }}
              editable={!isPending}
              multiline
            />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.buttonContainer}>
              <CustomAnimatedButton
                style={{
                  backgroundColor: 'white',
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: 9999,
                  width: 'auto',
                  height: 44,
                }}
                variant="default"
                size="default"
                onPress={async () => {
                  await haptic('Medium');
                  createSpace({body: { text_content: description, feed_id: feedId }});
                }}
                disabled={isPending}
                isLoading={isPending}
                loadingColor="#2563EB"
              >
                <Text style={{ color: '#2563EB', fontWeight: '600' }}>
                  {isPending ? 'მუშავდება...' : 'დაწყება'}
                </Text>
              </CustomAnimatedButton>

              <TouchableOpacity
                style={[
                  styles.scheduleButton,
                  isPending && styles.disabledButton,
                ]}
                onPress={async () => {
                  await haptic('Light');
                  router.push({
                    pathname: `/(tabs)/(home)/create-space/schedule-space`,
                    params: { feedId, description: description },
                  });
                }}
                disabled={isPending}
              >
                <Ionicons name="calendar-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    paddingTop: 100,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '600',
    marginBottom: 16,
  },
  subtitle: {
    color: '#D1D5DB',
    textAlign: 'center',
    fontSize: FontSizes.medium,
    marginBottom: 40,
  },
  infoContainer: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  icon: {
    marginTop: 4,
  },
  infoText: {
    color: '#D1D5DB',
    fontSize: FontSizes.medium,
    marginLeft: 16,
  },
  understandButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 9999,
    marginTop: 32,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    color: 'white',
    fontSize: 18,
    backgroundColor: '#27272A',
    borderRadius: 16,
    padding: 16,
    maxHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  scheduleButton: {
    backgroundColor: '#27272A',
    padding: 12,
    borderRadius: 9999,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
