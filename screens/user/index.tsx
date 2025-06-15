import { View, StyleSheet } from "react-native";
import React, { useRef } from "react";
import { useNavigation } from "expo-router";
import Button from "@/components/Button";
import { Search } from "@/lib/icons/Search";
import { Ionicons } from "@expo/vector-icons";
import FriendRequests from "@/components/ContactSyncSheet/FriendRequests";
import UserGNContentProfile from "@/components/UserGNContentProfile";
import { SectionHeader } from "@/components/SectionHeader";
import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";
import ProfileView from "@/components/ProfileView";
import { useTheme } from "@/lib/theme";
import BottomSheet from "@gorhom/bottom-sheet";
import ContactSyncSheet from "@/components/ContactSyncSheet";

export default function ProfileMain() {
  const { user } = useAuth();
  const theme = useTheme();
  const contactSyncSheetRef = useRef<BottomSheet>(null);
  return (
    <>
      <ContactSyncSheet bottomSheetRef={contactSyncSheetRef} />
      <UserGNContentProfile
        userId={user?.id}
        topHeader={
          <>
            <ProfileView userId={user?.id} />
            <View style={styles.container}>
              <View style={styles.sectionContainer}>
                <SectionHeader
                  icon={<Search size={26} color={theme.colors.icon} />}
                  text="მეგობრები"
                />
                <Button
                  style={styles.friendButton}
                  variant="secondary"
                  size="large"
                  onPress={() => {
                    contactSyncSheetRef.current?.expand();
                  }}
                  icon="people-outline"
                  iconPosition="left"
                  title="მეგობრების დამატება"
                />
                <FriendRequests hideMyRequests limit={3} />
              </View>
              <View style={styles.sectionContainer}>
                <SectionHeader
                  icon={
                    <Ionicons
                      size={26}
                      name="time-outline"
                      color={theme.colors.icon}
                    />
                  }
                  text="ისტორია"
                />
              </View>
            </View>
          </>
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  buttonText: {
    marginLeft: 16,
  },
  friendButton: {
    marginVertical: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});
