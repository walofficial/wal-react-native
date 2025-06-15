import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Text } from "@/components/ui/text";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import * as Contacts from "expo-contacts";
import ContactItem from "./ContactItem";
import { User } from "@/lib/interfaces";
import ContactListHeader from "./ContactListHeader";
import { useFriendRequest } from "@/lib/hooks/useFriendRequest";
import { useAtom } from "jotai";
import { checkedCountAtom, displayedContactsAtom } from "./atom";

const RegisteredContactsList: React.FC = () => {
  const queryClient = useQueryClient();

  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [displayedContacts, setDisplayedContacts] = useAtom(
    displayedContactsAtom
  );
  const [checkedCount, setCheckedCount] = useAtom(checkedCountAtom);
  const [batchSize, setBatchSize] = useState(300);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    if (checkedCount === 0) {
      setDisplayedContacts([]);
    }
  }, [checkedCount]);

  useEffect(() => {
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
          pageSize: batchSize,
          pageOffset: checkedCount,
        });

        setContacts((prevContacts) => [...prevContacts, ...data]);
        setHasNextPage(hasNextPage);
      }
    };

    fetchContacts();
  }, [checkedCount]);

  const {
    data: registeredContacts = [],
    isLoading,
    isSuccess,
  } = useQuery({
    queryKey: ["registeredContacts", checkedCount],
    queryFn: () =>
      api.checkRegisteredUsers(
        contacts.slice(checkedCount, checkedCount + batchSize)
      ),
  });

  useEffect(() => {
    if (registeredContacts.length > 0) {
      setDisplayedContacts((prev) => [
        ...prev,
        ...registeredContacts.slice(0, 5),
      ]);
      setCheckedCount((prev) => prev + batchSize);
    }
  }, [registeredContacts.length]);

  const loadMore = () => {
    const newDisplayedContacts = registeredContacts.slice(
      0,
      displayedContacts.length + 10
    );
    setDisplayedContacts(newDisplayedContacts);

    if (checkedCount < contacts.length) {
      queryClient.invalidateQueries({ queryKey: ["registeredContacts"] });
    }
  };

  const friendRequestMutation = useFriendRequest();

  const handleAddFriend = (contact: User) => {
    friendRequestMutation.mutate(contact.id);
  };

  const uniqueContacts = displayedContacts.filter(
    (contact, index, self) =>
      index === self.findIndex((t) => t.id === contact.id)
  );

  if (uniqueContacts.length === 0 && !isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {uniqueContacts.length > 0 && (
        <ContactListHeader icon="sparkles-outline" title="იყენებენ" />
      )}
      {uniqueContacts.length > 0
        ? uniqueContacts.map((item) => (
            <ContactItem
              key={item.id}
              id={item.id}
              alreadyOnApp={true}
              name={item.username || ""}
              phone_number={item.phone_number || ""}
              image={item.photos.length ? item.photos[0].image_url[0] : ""}
              onAddPress={() => handleAddFriend(item)}
              buttonText="დამატება"
              isLoading={
                friendRequestMutation.variables === item.id &&
                friendRequestMutation.isPending
              }
              friendRequestSent={
                friendRequestMutation.variables === item.id &&
                friendRequestMutation.isSuccess
              }
            />
          ))
        : null}
      {registeredContacts.length > uniqueContacts.length && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMore}
          disabled={isLoading}
        >
          <Text style={styles.loadMoreText}>
            {isLoading ? "იტვირთება..." : "ჩამოტვირთე"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  loadMoreButton: {
    backgroundColor: "#6B7280",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    marginTop: 16,
    alignSelf: "center",
  },
  loadMoreText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default RegisteredContactsList;
