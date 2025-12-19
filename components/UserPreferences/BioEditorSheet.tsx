import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Portal } from '@/components/primitives/portal';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/theme';
import { getBottomSheetBackgroundStyle } from '@/lib/styles';
import useAuth from '@/hooks/useAuth';
import { t } from '@/lib/i18n';
import {
  getUserProfileUserProfileUserIdGetQueryKey,
  updateUserMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function BioEditorSheet({
  bottomSheetRef,
  userId,
  initialBio,
}: {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  userId: string;
  initialBio?: string | null;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, setAuthUser } = useAuth();
  const inputRef = useRef<TextInput>(null);

  const [draft, setDraft] = useState(initialBio ?? '');

  useEffect(() => {
    setDraft(initialBio ?? '');
  }, [initialBio]);

  const snapPoints = useMemo(() => ['50%'], []);
  const sheetBackgroundStyle = getBottomSheetBackgroundStyle();

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const updateUser = useMutation({
    ...updateUserMutation(),
    onMutate: (variables) => {
      if (!user) return;
      if (typeof variables.body.bio === 'undefined') return;
      setAuthUser({
        ...user,
        bio: variables.body.bio as any,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getUserProfileUserProfileUserIdGetQueryKey({
          path: { user_id: userId },
        }),
      });
    },
    onError: () => {
      Alert.alert(t('common.error'), t('common.profile_update_failed'));
    },
  });

  const trimmedDraft = draft.trim();
  const isDirty = trimmedDraft !== (initialBio ?? '').trim();
  const hasBio = Boolean(initialBio?.trim());

  // Auto-save on close if changed
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === 0) {
        // Auto-focus with slight delay for sheet animation
        setTimeout(() => {
          inputRef.current?.focus();
        }, 300);
      } else if (index === -1) {
        // Save on close if dirty
        if (isDirty) {
          updateUser.mutate({
            body: {
              bio: trimmedDraft.length ? trimmedDraft : null,
            },
          });
        }
      }
    },
    [isDirty, trimmedDraft, updateUser],
  );

  const handleDelete = () => {
    Alert.alert(t('profile.delete_bio'), t('profile.delete_bio_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setDraft('');
          updateUser.mutate({ body: { bio: null } });
          bottomSheetRef.current?.close();
        },
      },
    ]);
  };

  return (
    <Portal name="bio-editor-sheet">
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        topInset={insets.top + 50}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={sheetBackgroundStyle}
        handleIndicatorStyle={[
          styles.handleIndicator,
          { backgroundColor: theme.colors.icon },
        ]}
        onChange={handleSheetChange}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            {t('profile.about_me')}
          </Text>
          {hasBio && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.deleteButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={theme.colors.accent}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            // placeholder={t('profile.bio_placeholder')}
            placeholderTextColor={theme.colors.feedItem.secondaryText}
            style={[styles.input, { color: theme.colors.text }]}
            multiline
            textAlign="center"
            textAlignVertical="center"
            scrollEnabled={false}
            blurOnSubmit={false}
          />
        </View>
      </BottomSheet>
    </Portal>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    width: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  input: {
    width: '100%',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '500',
    paddingVertical: 16,
  },
});
