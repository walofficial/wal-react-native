import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
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
import { ProfileInformationResponse } from '@/lib/api/generated';
import Ionicons from '@expo/vector-icons/Ionicons';

const MAX_BIO_LENGTH = 150;

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, setAuthUser } = useAuth();
  const [shouldFocus, setShouldFocus] = useState(false);

  const [draft, setDraft] = useState(initialBio ?? '');

  useEffect(() => {
    setDraft(initialBio ?? '');
  }, [initialBio]);

  const snapPoints = useMemo(() => ['45%'], []);
  const sheetBackgroundStyle = getBottomSheetBackgroundStyle();

  // Input background color - subtle dark gray for dark mode, light gray for light
  const inputBackground = isDark ? '#1c1c1e' : '#f2f2f7';
  const placeholderColor = isDark ? '#636366' : '#8e8e93';

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

  const profileQueryKey = getUserProfileUserProfileUserIdGetQueryKey({
    path: { user_id: userId },
  });

  const updateUser = useMutation({
    ...updateUserMutation(),
    onMutate: async (variables) => {
      if (typeof variables.body.bio === 'undefined') return;

      // Cancel outgoing refetches to avoid race conditions
      await queryClient.cancelQueries({ queryKey: profileQueryKey });

      // Snapshot previous value
      const previousProfile =
        queryClient.getQueryData<ProfileInformationResponse>(profileQueryKey);

      // Optimistically update the profile cache
      if (previousProfile) {
        queryClient.setQueryData<ProfileInformationResponse>(profileQueryKey, {
          ...previousProfile,
          bio: variables.body.bio ?? null,
        });
      }

      // Update auth user optimistically
      if (user) {
        setAuthUser({
          ...user,
          bio: variables.body.bio as any,
        });
      }

      return { previousProfile };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData<ProfileInformationResponse>(
          profileQueryKey,
          context.previousProfile,
        );
      }
      Alert.alert(t('common.error'), t('common.profile_update_failed'));
    },
  });

  const trimmedDraft = draft.trim();
  const isDirty = trimmedDraft !== (initialBio ?? '').trim();
  const hasBio = Boolean(draft.trim());

  // Auto-save on close if changed
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === 0) {
        setShouldFocus(true);
      } else if (index === -1) {
        setShouldFocus(false);
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

  const handleTextChange = (text: string) => {
    if (text.length <= MAX_BIO_LENGTH) {
      setDraft(text);
    }
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
          { backgroundColor: isDark ? '#48484a' : '#c7c7cc' },
        ]}
        onChange={handleSheetChange}
      >
        <View style={styles.container}>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: inputBackground },
            ]}
          >
            <BottomSheetTextInput
              key={shouldFocus ? 'focused' : 'unfocused'}
              autoFocus={shouldFocus}
              value={draft}
              onChangeText={handleTextChange}
              placeholder={t('profile.bio_placeholder')}
              placeholderTextColor={placeholderColor}
              style={[styles.input, { color: theme.colors.text }]}
              multiline
              maxLength={MAX_BIO_LENGTH}
              scrollEnabled={true}
              blurOnSubmit={false}
            />

            {hasBio && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.clearButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View
                  style={[
                    styles.clearButtonInner,
                    { backgroundColor: isDark ? '#48484a' : '#c7c7cc' },
                  ]}
                >
                  <Ionicons
                    name="close"
                    size={12}
                    color={isDark ? '#fff' : '#000'}
                  />
                </View>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.charCount, { color: placeholderColor }]}>
            {draft.length}/{MAX_BIO_LENGTH}
          </Text>
        </View>
      </BottomSheet>
    </Portal>
  );
}

const styles = StyleSheet.create({
  handleIndicator: {
    width: 36,
    height: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 120,
    position: 'relative',
  },
  input: {
    fontSize: 16,
    lineHeight: 22,
    paddingRight: 24,
    textAlignVertical: 'top',
  },
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  clearButtonInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
    paddingRight: 4,
  },
});
