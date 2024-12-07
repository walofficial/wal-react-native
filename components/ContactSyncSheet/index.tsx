import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
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
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ContactSyncSheet = forwardRef<BottomSheet>((props, ref) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [pageOffset, setPageOffset] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const pageSize = 30;
  const [isContactSyncSheetOpen, setIsContactSyncSheetOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["85%"], []);

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
    if (isContactSyncSheetOpen) {
      fetchContacts();
    }
  }, [pageOffset, isContactSyncSheetOpen]);

  const fetchContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
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

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      topInset={insets.top + (Platform.OS === "android" ? 50 : 0)}
      bottomInset={0}
      enableDynamicSizing={false}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: "black",
      }}
      onChange={(index) => {
        if (index === -1) {
          setIsContactSyncSheetOpen(false);
        } else {
          setIsContactSyncSheetOpen(true);
        }
      }}
      keyboardBehavior={Platform.OS === "ios" ? "interactive" : "none"}
      animateOnMount={false}
      handleIndicatorStyle={{ backgroundColor: "white" }}
    >
      <Text className="text-2xl font-bold mb-4 text-center">
        დაიმატე მეგობრები
      </Text>
      <View className="flex-row items-center border-2 border-gray-600 rounded-full px-4 py-2 mb-4">
        <Ionicons name="search" size={25} color="white" />
        <BottomSheetTextInput
          autoComplete="off"
          value={searchQuery}
          onChangeText={handleSearch}
          style={{
            color: "white",
          }}
          placeholderTextColor="gray"
          placeholder={"მოძებნე სახელით ან ნომრით"}
          className="flex-1 ml-2 h-9 text-base text-white pl-4 border-transparent !border-none dark:text-white flex flex-row items-center px-3 bg-transparent"
        />
      </View>
      <BottomSheetScrollView>
        {!searchQuery && isContactSyncSheetOpen && <AddUserFromOtherApps />}
        {!searchQuery && isContactSyncSheetOpen && <FriendRequests />}
        {!searchQuery && isContactSyncSheetOpen && <FriendsList />}
        {!searchQuery && isContactSyncSheetOpen && <RegisteredContactsList />}
        {!searchQuery && (
          <ContactListHeader
            icon="people-outline"
            title="დაიმატე კონტაქტებიდან"
          />
        )}
        {isContactSyncSheetOpen &&
          filteredContacts.map((item, index) => (
            <ContactItem
              key={
                item.phoneNumbers?.[0]?.number?.toString() +
                item.firstName +
                item.lastName +
                item.id +
                index
              }
              buttonText="დამატება"
              id={item.id || item.firstName || item.lastName || ""}
              alreadyOnApp={false}
              name={item.name || item.firstName || item.lastName || ""}
              phone_number={item.phoneNumbers?.[0]?.number || ""}
              image={item.image?.uri || ""}
              onAddPress={() => handleAddFriend(item)}
            />
          ))}
        {filteredContacts.length === 0 && (
          <Text className="text-center text-lg text-gray-500 mt-4">
            {"კონტაქტები არ მოიძებნა, სცადეთ დართოთ ნებართვა კონტაქტებზე"}
          </Text>
        )}
        {filteredContacts.length > 0 && !searchQuery && (
          <TouchableOpacity
            className="bg-gray-500 px-4 py-2 rounded-full mt-4 self-center"
            onPress={loadMoreContacts}
          >
            <Text className="text-white font-semibold">ჩამოტვირთე</Text>
          </TouchableOpacity>
        )}
        <View style={{ paddingBottom: 150 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default ContactSyncSheet;
