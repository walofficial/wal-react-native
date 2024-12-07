import ActionSheet, { SheetProps } from "react-native-actions-sheet";
import useGetUserVerification from "@/hooks/useGetUserVerification";
import MakePublic from "../MakePublic";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import useAuth from "@/hooks/useAuth";
import CustomToast from "../CustomToast";
function MakeItPublicSheet(props: SheetProps<"user-make-it-public-sheet">) {
  const {
    data: verification,
    isFetching,
    isSuccess,
  } = useGetUserVerification(
    props.payload?.matchId,
    props.payload?.userId,
    true
  );

  const { user } = useAuth();

  const isAuthor = props.payload?.userId === user.id;

  const hideView =
    !verification ||
    !props.payload.matchId === undefined ||
    !props.payload.userId;

  return (
    <ActionSheet
      ExtraOverlayComponent={<CustomToast />}
      gestureEnabled
      containerStyle={{ backgroundColor: "black" }}
    >
      {!hideView && (
        <View className="p-2 px-8 h-40 flex flex-col justify-center items-center">
          <Text className="mb-5 text-2xl text-green-300 text-center">
            ვერიფიცირებულია
          </Text>
          {isAuthor && (
            <MakePublic
              isButton={true}
              defaultValue={!!verification?.is_public}
              verificationId={verification?.id}
            />
          )}
        </View>
      )}
    </ActionSheet>
  );
}

export default MakeItPublicSheet;
