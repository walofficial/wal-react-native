import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMakePublicMutation } from '@/hooks/useMakePublicMutation';
import { toast } from '@backpackapp-io/react-native-toast';
import { useToast } from '../ToastUsage';
import { t } from '@/lib/i18n';

export default function MakePublic({
  verificationId,
  defaultValue,
}: {
  verificationId: string;
  defaultValue?: boolean;
}) {
  const { success } = useToast();

  const [isPublic, setIsPublic] = useState(defaultValue);
  const mutation = useMakePublicMutation();

  const handleToggle = () => {
    const newValue = !isPublic;
    setIsPublic(newValue);
    mutation.mutate(
      {
        body: {
          verification_id: verificationId,
          is_public: newValue,
        },
      },
      {
        onError: () => {
          setIsPublic(!newValue);
        },
        onSuccess: () => {
          success({
            title: newValue ? t('common.published') : t('common.hidden'),
          });
        },
      },
    );
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={[styles.button, { backgroundColor: '#efefef' }]}
    >
      <Text style={styles.buttonText}>
        {isPublic ? t('common.hide') : t('common.publish')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    padding: 16,
  },
  buttonText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '600',
  },
});
