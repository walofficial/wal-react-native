// @ts-nocheck
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  RefObject,
} from "react";
import {
  View,
  TouchableOpacity,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { Text } from "@/components/ui/text";
import { Contact } from "expo-contacts";
import RegisteredContactsList from "./RegisteredContactsList";
import ContactItem from "./ContactItem";
import ContactListHeader from "./ContactListHeader";
import FriendRequests from "./FriendRequests";
import FriendsList from "./FriendsList";
import AddUserFromOtherApps from "./AddUserFromOtherApps";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getBottomSheetBackgroundStyle } from "@/lib/styles";
import { FontSizes } from "@/lib/theme";
import useSheetCloseOnNavigation from "@/hooks/sheetCloseOnNavigation";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/lib/api/generated";
import { useFriendRequest } from "@/lib/hooks/useFriendRequest";
import { useTheme } from "@/lib/theme";
import { useAtom } from "jotai";
import { contactSyncSheetState } from "@/lib/atoms/contactSync";
import { Portal } from "@/components/primitives/portal";
import { useOnboarding } from "../../hooks/useOnboardingContext";
import { getUserProfileByUsernameOptions } from "@/lib/api/generated/@tanstack/react-query.gen";
import { t } from "@/lib/i18n";

interface ContactSyncSheetProps {
  bottomSheetRef: RefObject<BottomSheet>;
}

const ContactSyncSheet = ({ bottomSheetRef }: ContactSyncSheetProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [pageOffset, setPageOffset] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useAtom(
    contactSyncSheetState
  );
  const pageSize = 30;
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["85%"], []);
  const [contactsPermissionGranted, setContactsPermissionGranted] =
    useState(false);
  const { handleSheetPositionChange } = useSheetCloseOnNavigation(
    bottomSheetRef as React.RefObject<BottomSheetModal>
  );
  const { mutate: sendFriendRequest, isPending: isSendingRequest } =
    useFriendRequest();
  const theme = useTheme();
  const sheetBackgroundStyle = getBottomSheetBackgroundStyle();
  const { onboardingState, markTutorialAsSeen } = useOnboarding();

  // Add user search query
  const { data: searchedUsers, isLoading: isSearching } = useQuery({
    ...getUserProfileByUsernameOptions({
      path: {
        username: searchQuery,
      },
    }),
    enabled: searchQuery.length > 0,
    staleTime: 1000 * 60, // Cache for 1 minute
  });
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  useEffect(() => {
    try {
      fetchContacts();
    } catch (e) {
      // Let's silent this error because we already show message for the user to enable permission for contacts
      // If we don't silence this Sentry might get overloaded
      console.error("Couldn't get access to contacts");
    }
  }, [pageOffset]);

  useEffect(() => {
    if (isBottomSheetOpen) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isBottomSheetOpen, bottomSheetRef]);

  useEffect(() => {
    // On first mount, if onboarding for contact sync not seen, open sheet and mark as seen
    if (!onboardingState.hasSeenContactSync) {
      setIsBottomSheetOpen(true);
      markTutorialAsSeen("hasSeenContactSync");
    }
  }, []);

  const fetchContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    setContactsPermissionGranted(status === "granted");
    if (status === "granted") {
      const { data, hasNextPage } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
        ],

        pageSize: pageSize,
        pageOffset: pageOffset,
      });
      const filteredData = data.filter((contact) => {
        // Check if contact has phone numbers and name
        if (
          !contact.phoneNumbers?.length ||
          !(contact.name || contact.firstName || contact.lastName)
        ) {
          return false;
        }

        // Get unique phone numbers by removing any formatting/spaces
        const uniqueNumbers = new Set(
          contact.phoneNumbers.map((p) => p.number?.replace(/\D/g, ""))
        );

        // Only keep contacts where number of unique numbers matches total numbers
        return uniqueNumbers.size === contact.phoneNumbers.length;
      });
      setContacts((prevContacts) => [...prevContacts, ...filteredData]);
      setFilteredContacts((prevContacts) => [...prevContacts, ...filteredData]);
      setHasNextPage(hasNextPage);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!contactsPermissionGranted) {
      // Let's not try to search for contacts if permissions aren't granted
      return;
    }
    if (query) {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
        ],
        pageSize: Number.MAX_SAFE_INTEGER, // Fetch all contacts
        name: query, // Use the name field for matching
      });
      setFilteredContacts(data);
      setHasNextPage(false); // Disable pagination when searching
    } else {
      setFilteredContacts(contacts);
      setHasNextPage(true); // Re-enable pagination when not searching
    }
  };

  const loadMoreContacts = () => {
    if (hasNextPage) {
      setPageOffset((prevOffset) => prevOffset + pageSize);
    }
  };

  const handleAddFriend = (contact: Contact) => {
    // Add friend logic here
    console.log("Adding friend:", contact.name);
  };

  const handleAddSearchedUser = async (userId: string) => {
    try {
      sendFriendRequest({
        body: {
          target_user_id: userId,
        },
      });
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const openAppSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else if (Platform.OS === "android") {
      Linking.openSettings();
    }
  };

  return (
    <Portal name="bottom-sheet">
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        onChange={(index) => {
          handleSheetPositionChange(index);
          setIsBottomSheetOpen(index !== -1);
        }}
        snapPoints={snapPoints}
        topInset={insets.top + (Platform.OS === "android" ? 50 : 50)}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        style={styles.bottomSheet}
        backgroundStyle={sheetBackgroundStyle}
        animateOnMount={false}
        handleIndicatorStyle={[
          styles.handleIndicator,
          { backgroundColor: theme.colors.icon },
        ]}
      >
        <BottomSheetView
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                theme.colors.card.background === "#F2F2F7"
                  ? "rgba(0, 0, 0, 0.05)"
                  : theme.colors.card.background,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.feedItem.secondaryText}
          />
          <BottomSheetTextInput
            autoComplete="off"
            value={searchQuery}
            onChangeText={handleSearch}
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholderTextColor={theme.colors.feedItem.secondaryText}
            placeholder={t("common.search_by_name_or_number")}
          />
        </BottomSheetView>
        <BottomSheetScrollView style={{ paddingHorizontal: 10 }}>
          {/* {contactsPermissionGranted && (
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              {t("common.add_friends")}
            </Text>
          )} */}
          {!searchQuery && <AddUserFromOtherApps />}
          {!searchQuery && <FriendRequests />}
          {!searchQuery && <FriendsList />}
          {!searchQuery && <RegisteredContactsList />}
          {!searchQuery && (
            <ContactListHeader
              icon="people-outline"
              title={t("common.add_friends_from_contacts")}
            />
          )}
          {searchQuery && filteredContacts.length > 0 && (
            <ContactListHeader
              icon="people-outline"
              title={t("common.from_searched_contacts")}
            />
          )}
          {filteredContacts.map((item, index) => (
            <ContactItem
              key={`contact-${index}-${item.id || ""}`}
              buttonText={t("common.add")}
              id={item.id || item.firstName || item.lastName || ""}
              alreadyOnApp={false}
              name={item.name || item.firstName || item.lastName || ""}
              phone_number={item.phoneNumbers?.[0]?.number || ""}
              image={item.image?.uri || ""}
              onAddPress={() => handleAddFriend(item)}
            />
          ))}
          <View style={{ height: 20 }} />
          {/* Display searched users */}
          {searchQuery && searchedUsers && (
            <>
              <ContactListHeader
                icon="search-outline"
                title={t("common.searched_users")}
              />
              <ContactItem
                key={searchedUsers.id}
                buttonText={t("common.add")}
                id={searchedUsers.id}
                alreadyOnApp={true}
                name={searchedUsers.username || ""}
                phone_number=""
                image={searchedUsers.photos?.[0]?.image_url?.[0] || ""}
                onAddPress={() => handleAddSearchedUser(searchedUsers.id)}
                friendRequestSent={sentRequests.has(searchedUsers.id)}
                isLoading={isSendingRequest}
              />
            </>
          )}

          {filteredContacts.length === 0 && !searchedUsers && (
            <>
              <Text
                style={[
                  styles.noContactsText,
                  { color: theme.colors.feedItem.secondaryText },
                ]}
              >
                {t("common.no_contacts_found")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.permissionButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={openAppSettings}
              >
                <Text style={styles.permissionButtonText}>
                  {t("common.enable_access")}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {filteredContacts.length > 0 && !searchQuery && (
            <TouchableOpacity
              style={[
                styles.loadMoreButton,
                { backgroundColor: theme.colors.feedItem.secondaryText },
              ]}
              onPress={loadMoreContacts}
            >
              <Text style={styles.loadMoreButtonText}>
                {t("common.load_more")}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.bottomPadding} />
        </BottomSheetScrollView>
      </BottomSheet>
    </Portal>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    paddingHorizontal: 16,
  },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    height: 36,
    fontSize: 17,
    padding: 0,
    fontWeight: "400",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  noContactsText: {
    textAlign: "center",
    fontSize: FontSizes.medium,
    marginTop: 24,
  },
  permissionButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    alignSelf: "center",
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "600",
  },
  loadMoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    marginTop: 24,
    marginBottom: 16,
    alignSelf: "center",
  },
  loadMoreButtonText: {
    color: "white",
    fontWeight: "600",
  },
  bottomPadding: {
    paddingBottom: 40,
  },
});

export default ContactSyncSheet;
