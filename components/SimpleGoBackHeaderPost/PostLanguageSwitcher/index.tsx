import React from 'react';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ContentLanguage } from '@/atoms/localization';
import { t } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import AnimatedPressable from '@/components/AnimatedPressable';
import { updateUserMutation } from '@/lib/api/generated/@tanstack/react-query.gen';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAuth from '@/hooks/useAuth';

interface PostLanguageSwitcherProps {
  onLanguageChange?: (language: ContentLanguage) => void;
}

function PostLanguageSwitcher({ onLanguageChange }: PostLanguageSwitcherProps) {
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
    onError: () => {
      Alert.alert(t('common.profile_update_failed'));
    },
  });

  const handleLanguageToggle = () => {
    const currentLanguage = user?.preferred_content_language || 'english';
    const languages: ContentLanguage[] = ['english', 'french', 'georgian'];
    const currentIndex = languages.indexOf(currentLanguage as ContentLanguage);
    const nextLanguage = languages[(currentIndex + 1) % languages.length];

    onLanguageChange?.(nextLanguage);
    updateUserMutationHook.mutate({
      body: {
        preferred_content_language: nextLanguage,
      },
    });
  };

  return (
    <AnimatedPressable
      onClick={handleLanguageToggle}
      style={{
        padding: 5,
        width: 40,
        height: 40,
        marginBottom: 5,
        borderWidth: 0,
      }}
    >
      <Ionicons name="language-outline" size={24} color={theme.colors.icon} />
    </AnimatedPressable>
  );
}

export default PostLanguageSwitcher;
