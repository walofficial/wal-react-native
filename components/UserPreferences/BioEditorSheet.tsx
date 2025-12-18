import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Portal } from '@/components/primitives/portal';
import { Text } from '@/components/ui/text';
import Button from '@/components/Button';
import { useTheme } from '@/lib/theme';
import { getBottomSheetBackgroundStyle } from '@/lib/styles';
import useAuth from '@/hooks/useAuth';
import {
  getUserProfileUserProfileUserIdGetQueryKey,
  updateUserMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';

const MAX_BIO_CHARS = 280;

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

  const [draft, setDraft] = useState(initialBio ?? '');

  useEffect(() => {
    setDraft(initialBio ?? '');
  }, [initialBio]);

  const snapPoints = useMemo(() => ['60%'], []);
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
      bottomSheetRef.current?.close();
      queryClient.invalidateQueries({
        queryKey: getUserProfileUserProfileUserIdGetQueryKey({
          path: { user_id: userId },
        }),
      });
    },
    onError: () => {
      Alert.alert('Failed to update bio');
    },
  });

  const trimmedDraft = draft.trim();
  const isDirty = trimmedDraft !== (initialBio ?? '').trim();
  const remaining = MAX_BIO_CHARS - draft.length;

  const handleSave = () => {
    updateUser.mutate({
      body: {
        bio: trimmedDraft.length ? trimmedDraft : null,
      },
    });
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
      >
        <View style={styles.headerRow}>
          <Button
            variant="subtle"
            title="Cancel"
            onPress={() => bottomSheetRef.current?.close()}
            style={{ minWidth: 'auto' }}
          />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Bio
          </Text>
          <Button
            variant="subtle"
            title="Save"
            onPress={handleSave}
            disabled={!isDirty || updateUser.isPending}
            style={{ minWidth: 'auto' }}
          />
        </View>

        <View style={styles.content}>
          <BottomSheetTextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Write something about you…"
            placeholderTextColor={theme.colors.feedItem.secondaryText}
            style={[
              styles.input,
              { color: theme.colors.text, borderColor: theme.colors.border },
            ]}
            multiline
            maxLength={MAX_BIO_CHARS}
          />
          <Text style={{ color: theme.colors.feedItem.secondaryText }}>
            {remaining}
          </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    gap: 10,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 140,
    fontSize: 16,
    lineHeight: 22,
  },
});


