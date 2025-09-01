import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { reportUserReportTargetIdPostMutation } from '@/lib/api/generated/@tanstack/react-query.gen';

function useReportTask() {
  return useMutation({
    ...reportUserReportTargetIdPostMutation(),
    onSuccess: () => {
      Alert.alert('რეპორტი გამოიგზავნა', 'მოდერაცია გადახედავს 24 საათში');
    },
    onError: () => {
      Alert.alert('შეცდომა', 'დაფიქსირდა შეცდომა. გთხოვთ სცადოთ თავიდან');
    },
  });
}

export default useReportTask;
