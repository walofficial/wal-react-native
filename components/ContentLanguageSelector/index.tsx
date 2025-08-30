import React, { useRef } from 'react';
import { Pressable, StyleSheet, Platform, Alert } from 'react-native';
import {
  MenuView as RNMenuView,
  MenuComponentRef,
} from '@react-native-menu/menu';
import { Ionicons } from '@expo/vector-icons';
import { useAtom } from 'jotai';
import { ContentLanguage } from '@/atoms/localization';
import { t } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { Text } from '@/components/ui/text';
import AnimatedPressable from '@/components/AnimatedPressable';
import {
  getUserVerificationQueryKey,
  updateUserMutation,
} from '@/lib/api/generated/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../AuthLayer';
import useAuth from '@/hooks/useAuth';
import { getLocationFeedPaginatedInfiniteOptions } from '@/lib/api/generated/@tanstack/react-query.gen';

interface ContentLanguageSelectorProps {
  onLanguageChange?: (language: ContentLanguage) => void;
}

const ContentLanguageSelector: React.FC<ContentLanguageSelectorProps> = ({
  onLanguageChange,
}) => {
  const menuRef = useRef<MenuComponentRef>(null);
  const { user, setAuthUser } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const updateUserMutationHook = useMutation({
    ...updateUserMutation(),
    onMutate: (variables) => {
      if (user) {
        setAuthUser({
          ...user,
          preferred_content_language: variables.body.preferred_content_language,
        });
      }
    },
    onSuccess: () => {
      queryClient.resetQueries();
    },
    onError: (error) => {
      Alert.alert(t('common.profile_update_failed'));
    },
  });

  const handleLanguageSelect = (language: ContentLanguage) => {
    onLanguageChange?.(language);
    updateUserMutationHook.mutate({
      body: {
        preferred_content_language: language,
      },
    });
  };

  const getLanguageDisplayName = (language: ContentLanguage): string => {
    return t(`languages.${language}`);
  };

  const getCurrentLanguageName = (): string => {
    return getLanguageDisplayName(
      user?.preferred_content_language as ContentLanguage,
    );
  };

  return (
    <RNMenuView
      ref={menuRef}
      title={t('settings.preferred_content_language')}
      onPressAction={({ nativeEvent }) => {
        const selectedLanguage = nativeEvent.event as ContentLanguage;
        if (
          selectedLanguage &&
          ['english', 'french', 'georgian'].includes(selectedLanguage)
        ) {
          handleLanguageSelect(selectedLanguage);
        }
      }}
      shouldOpenOnLongPress={false}
      actions={[
        {
          id: 'english',
          title: getLanguageDisplayName('english'),
          state: user?.preferred_content_language === 'english' ? 'on' : 'off',
        },
        {
          id: 'french',
          title: getLanguageDisplayName('french'),
          state: user?.preferred_content_language === 'french' ? 'on' : 'off',
        },
        {
          id: 'georgian',
          title: getLanguageDisplayName('georgian'),
          state: user?.preferred_content_language === 'georgian' ? 'on' : 'off',
        },
      ]}
    >
      <AnimatedPressable
        onClick={() => {
          if (Platform.OS === 'android') {
            menuRef.current?.show();
          }
        }}
      >
        <Ionicons size={28} name="language-outline" color={theme.colors.icon} />
        <Text style={[styles.buttonText, { color: theme.colors.text }]}>
          {t('settings.preferred_content_language')}
        </Text>
        <Text style={[styles.selectedText, { color: theme.colors.text }]}>
          {getCurrentLanguageName()}
        </Text>
      </AnimatedPressable>
    </RNMenuView>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    marginLeft: 16,
    fontWeight: '600',
  },
  selectedText: {
    marginLeft: 16,
    fontSize: 14,
    opacity: 0.7,
  },
});

export default ContentLanguageSelector;
