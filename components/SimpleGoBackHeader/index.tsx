import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isWeb } from "@/lib/platform";
import ShareButton from "../FeedItem/ShareButton";
import CloseButton from "../CloseButton";
import { useTheme } from "@/lib/theme";
import useAuth from "@/hooks/useAuth";
import { HOME_TASK_ID } from "@/constants/home";

interface SimpleGoBackHeaderProps {
  title?: string;
  rightSection?: React.ReactNode;
  verificationId?: string;
  timestamp?: string;
}

const SimpleGoBackHeader = ({
  title,
  rightSection,
  verificationId,
  timestamp,
}: SimpleGoBackHeaderProps) => {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const finalRightSection = verificationId ? (
    <ShareButton verificationId={verificationId} bright={true} />
  ) : (
    rightSection
  );
  const Header = () =>
    !isWeb && (
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <CloseButton
          variant="back"
          onClick={() => {
            if (user) {
              router.replace(`/(tabs)/(global)/${HOME_TASK_ID}`);
            } else {
              router.navigate("/(auth)/sign-in");
            }
          }}
          style={{ color: theme.colors.text }}
        />
        {(title || timestamp) && (
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {timestamp || title}
          </Text>
        )}
        {finalRightSection}
      </View>
    );

  return <Header />;
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    zIndex: 10,
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingHorizontal: 10,
  },
  backButton: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 40,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    position: "absolute",
    left: 60,
    right: 60,
  },
  rightSection: {
    minWidth: 40,
    alignItems: "flex-end",
    padding: 5,
  },
});

export default SimpleGoBackHeader;
