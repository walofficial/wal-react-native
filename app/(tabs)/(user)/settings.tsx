import React from "react";
import {
  View,
  ScrollView,
  Linking,
  Touchable,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router, useRouter } from "expo-router";
import { Image } from "@/lib/icons/Image";
import { Text } from "@/components/ui/text";
import LogoutButton from "@/components/LogoutButton";
import { Ionicons } from "@expo/vector-icons";
import AnimatedPressable from "@/components/AnimatedPressable";
import { SectionHeader } from "@/components/SectionHeader";
import { Telegram } from "@/lib/icons/Telegram";
import useGetBlockedUsers from "@/hooks/useGetBlockedUsers";
import { User } from "lucide-react-native";
import { useTheme } from "@/lib/theme";
import { useAtomValue } from "jotai";
import { FontSizes } from "@/lib/theme";
import useFeeds from "@/hooks/useFeeds";
import { t } from "@/lib/i18n";
interface ProfileButtonProps {
  href: any;
  icon: React.ReactNode | ((props: { color?: string }) => React.ReactNode);
  text: string;
}

const ProfileButton = ({ href, icon: Icon, text }: ProfileButtonProps) => {
  const router = useRouter();
  const theme = useTheme();
  const IconComponent =
    typeof Icon === "function" ? Icon({ color: theme.colors.icon }) : Icon;

  return (
    <AnimatedPressable
      onClick={() => {
        router.navigate(href);
      }}
    >
      {IconComponent}
      <Text style={[styles.buttonText, { color: theme.colors.text }]}>
        {text}
      </Text>
    </AnimatedPressable>
  );
};

export default function ProfileMain() {
  const { blockedUsers, isLoading } = useGetBlockedUsers();
  const hasBlockedUsers = blockedUsers && blockedUsers.length > 0;
  const theme = useTheme();
  const { headerHeight } = useFeeds();
  const openTelegramChannel = () => {
    Linking.openURL("https://t.me/waldiscuss");
  };

  return (
    <>
      <ScrollView
        style={[
          styles.scrollView,
          { backgroundColor: theme.colors.background },
          { paddingTop: headerHeight },
        ]}
      >
        <View style={styles.container}>
          <SectionHeader
            icon={
              <Ionicons
                size={28}
                name="person-outline"
                color={theme.colors.icon}
              />
            }
            text={t("settings.general")}
          />

          <ProfileButton
            href="(user)/change-photo"
            icon={({ color }) => <Image color={color} />}
            text={t("settings.change_photo")}
          />
          <ProfileButton
            href="(user)/profile-settings"
            icon={({ color }) => <User color={color} />}
            text={t("settings.account")}
          />
          <ProfileButton
            href="(user)/language-region"
            icon={({ color }) => (
              <Ionicons size={28} name="globe-outline" color={color} />
            )}
            text={t("settings.language_and_region")}
          />
        </View>
      </ScrollView>
      <View
        style={[
          styles.bottomContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <AnimatedPressable onClick={openTelegramChannel}>
          <View style={styles.telegramIcon}>
            <Telegram color={theme.colors.icon} />
          </View>
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            {t("settings.telegram_channel")}
          </Text>
        </AnimatedPressable>
        {hasBlockedUsers && (
          <AnimatedPressable
            onClick={() => {
              router.navigate("/(tabs)/(user)/blocked-users");
            }}
          >
            <Ionicons
              size={22}
              name="person-outline"
              color={theme.colors.icon}
            />
            <Text style={[styles.buttonText, { color: theme.colors.text }]}>
              {t("settings.blocked_users")}
            </Text>
          </AnimatedPressable>
        )}
        <LogoutButton />
        <View style={styles.footerLinks}>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                "https://app.termly.io/policy-viewer/policy.html?policyUUID=a118a575-bf92-4a88-a954-1589ae572d09"
              );
            }}
            style={styles.footerLink}
          >
            <Text style={styles.footerLinkText}>
              {t("settings.terms_of_service")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                "https://app.termly.io/policy-viewer/policy.html?policyUUID=c16d10b8-1b65-43ea-9568-30e7ce727a60"
              );
            }}
            style={styles.footerLink}
          >
            <Text style={styles.footerLinkText}>
              {t("settings.privacy_policy")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* <Button
              onClick={() => {
                AsyncStorage.clear();
              }}
            >
        <Text>Clear Async Storage</Text>
      </Button> */}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    height: "100%",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  buttonText: {
    marginLeft: 16,
    fontWeight: "600",
  },
  bottomContainer: {
    flex: 1,
    position: "absolute",
    bottom: 0,
    padding: 20,
    width: "100%",
  },
  telegramIcon: {
    width: 24,
    height: 24,
  },
  footerLinks: {
    flexDirection: "row",
  },
  footerLink: {
    marginBottom: 12,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    fontSize: FontSizes.small,
  },
  footerLinkText: {
    marginRight: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    fontSize: 12,
  },
});
