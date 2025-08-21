// @ts-nocheck
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Share, { ShareSingleOptions, Social } from "react-native-share";
import ContactListHeader from "./ContactListHeader";
import { Text } from "@/components/ui/text";
import { Telegram } from "@/lib/icons/Telegram";
import { LinearGradient } from "expo-linear-gradient";
import useAuth from "@/hooks/useAuth";
import { useTheme } from "@/lib/theme";
import { app_name_slug } from "@/app.config";
import { t } from "@/lib/i18n";

const AddUserFromOtherApps: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();

  const shareMessage = `https://${app_name_slug}.ge/links/${user?.username}`;

  const shareToApp = async (app: keyof typeof Share.Social) => {
    const shareOptions: ShareSingleOptions = {
      title: "Share via",
      message: "წამო WAL ზე",
      url: shareMessage,
      social: Share.Social[app] as Social,
    };

    try {
      await Share.shareSingle(shareOptions);
    } catch (error) {
      console.error(`Error sharing to ${app}:`, error);
    }
  };

  const shareToOthers = async () => {
    const shareOptions = {
      message: "მოდი",
      url: `https://${app_name_slug}.ge/links/${user?.username}`,
    };

    try {
      await Share.open(shareOptions);
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ContactListHeader
        icon="share-social-outline"
        title={t("common.add_from_other_apps")}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => shareToApp("INSTAGRAM")}
          style={styles.buttonWrapper}
        >
          <View style={[styles.iconBorder, { borderColor: "#E1306C" }]}>
            <LinearGradient
              colors={[
                "#FFDC80",
                "#FCAF45",
                "#F77737",
                "#F56040",
                "#FD1D1D",
                "#E1306C",
                "#C13584",
                "#833AB4",
                "#5851DB",
                "#405DE6",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons name="logo-instagram" size={32} color="white" />
            </LinearGradient>
          </View>
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Instagram
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => shareToApp("WHATSAPP")}
          style={styles.buttonWrapper}
        >
          <View style={[styles.iconBorder, { borderColor: "#25D366" }]}>
            <View
              style={[styles.iconBackground, { backgroundColor: "#25D366" }]}
            >
              <Ionicons name="logo-whatsapp" size={32} color="white" />
            </View>
          </View>
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            WhatsApp
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => shareToApp("TELEGRAM")}
          style={styles.buttonWrapper}
        >
          <View style={[styles.iconBorder, { borderColor: "#0088cc" }]}>
            <View
              style={[styles.iconBackground, { backgroundColor: "#3B82F6" }]}
            >
              <Telegram />
            </View>
          </View>
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Telegram
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={shareToOthers} style={styles.buttonWrapper}>
          <View
            style={[styles.iconBorder, { borderColor: theme.colors.border }]}
          >
            <View
              style={[
                styles.iconBackground,
                { backgroundColor: theme.colors.secondary },
              ]}
            >
              <Ionicons name="share-outline" size={32} color="white" />
            </View>
          </View>
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            ლინკი
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 16,
    paddingHorizontal: 4,
  },
  buttonWrapper: {
    alignItems: "center",
    marginRight: 24,
  },
  iconBorder: {
    borderWidth: 2,
    borderRadius: 32,
    padding: 2,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    marginTop: 4,
    fontSize: 14,
  },
});

export default AddUserFromOtherApps;
