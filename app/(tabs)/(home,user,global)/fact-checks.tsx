import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../lib/theme";

export default function FactChecksExplanationGeorgian() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // Georgian Translations
  const translations = {
    title: "როგორ მუშაობს ფაქტების შემოწმება",
    overviewTitle: "მიმოხილვა",
    overviewText:
      "როდესაც ხედავთ ფაქტების შემოწმებას ან შეჯამებას, ჩვენ ვაანალიზებთ ვებ გვერდების, სოციალური მედიის პოსტებისა და სხვა წყაროების შინაარსს ფაქტობრივი სიზუსტის დასადასტურებლად. ჩვენი სისტემა ეძებს შესაბამის მითითებებს მრავალ ვებსაიტზე, რათა შეაფასოს განცხადებები და მოგაწოდოთ სრულყოფილი შეფასება.",
    scoresTitle: "როგორ ვითვლით ქულებს",
    scoresText1:
      "ჩვენი ფაქტობრივი სიზუსტის ქულა მერყეობს 0-დან 1-მდე, რაც წარმოადგენს რამდენად ზუსტია განცხადება ინტერნეტში ნაპოვნი მტკიცებულებების საფუძველზე. რაც უფრო მაღალია ქულა, მით უფრო ფაქტობრივად ზუსტია განცხადება.",
    scoresText2:
      'თითოეული მითითება კლასიფიცირდება როგორც "მხარდამჭერი" ან "არამხარდამჭერი" შესამოწმებელი განცხადებისთვის. ეს მითითებები პირდაპირ გავლენას ახდენს საბოლოო ფაქტობრივი სიზუსტის შეფასებაზე.',
    processTitle: "ჩვენი პროცესი",
    processSteps: [
      "ჩვენ ვაანალიზებთ მასალის სრულ ტექსტურ შინაარსს",
      "ჩვენი სისტემა ახორციელებს ღრმა ძიებას ყველა ნახსენები განცხადებისთვის",
      "ჩვენ ვპოულობთ შესაბამის მითითებებს მრავალი ვებსაიტიდან",
      "წყაროები ფასდება როგორც მხარდამჭერი ან არამხარდამჭერი",
      "ჩვენ გთავაზობთ შეჯამებას, ფაქტობრივი სიზუსტის ქულას და ორიგინალ წყაროებს",
    ],
    limitationsTitle: "შეზღუდვები",
    limitationsText:
      "მიუხედავად იმისა, რომ ჩვენი ფაქტების შემოწმების სისტემა ყოვლისმომცველია, მას აქვს შეზღუდვები. შედეგები დამოკიდებულია ხელმისაწვდომ ონლაინ ინფორმაციაზე, და ზოგიერთ თემას შეიძლება ჰქონდეს შეზღუდული ან ურთიერთგამომრიცხავი წყაროები. გირჩევთ, გადახედოთ მოწოდებულ წყაროებს საკუთარი შეფასების გასაკეთებლად.",
  };

  // Define icon names
  const icons = {
    overview: "information-circle" as const,
    scores: "stats-chart" as const,
    process: "git-branch" as const,
    limitations: "alert-circle" as const,
  };

  // Helper for section
  const Section = ({
    icon,
    title,
    children,
  }: {
    icon: any;
    title: string;
    children: React.ReactNode;
  }) => (
    <View
      style={[
        styles.section,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Ionicons
          name={icon}
          size={24}
          color={theme.colors.icon}
          style={styles.headerIcon}
        />
        <Text style={[styles.sectionTitle, { color: theme.colors.card.text }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.card.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {translations.title}
        </Text>
        <Section icon={icons.overview} title={translations.overviewTitle}>
          <Text
            style={[
              styles.paragraph,
              { color: theme.colors.feedItem.secondaryText },
            ]}
          >
            {translations.overviewText}
          </Text>
        </Section>
        <Section icon={icons.scores} title={translations.scoresTitle}>
          <Text
            style={[
              styles.paragraph,
              { color: theme.colors.feedItem.secondaryText },
            ]}
          >
            {translations.scoresText1}
          </Text>
          <Text
            style={[
              styles.paragraph,
              { color: theme.colors.feedItem.secondaryText, marginBottom: 0 },
            ]}
          >
            {translations.scoresText2}
          </Text>
        </Section>
        <Section icon={icons.process} title={translations.processTitle}>
          {translations.processSteps.map((step, idx) => (
            <Text
              key={idx}
              style={[
                styles.processStep,
                { color: theme.colors.feedItem.secondaryText },
              ]}
            >
              {step}
            </Text>
          ))}
        </Section>
        <Section icon={icons.limitations} title={translations.limitationsTitle}>
          <Text
            style={[
              styles.paragraph,
              { color: theme.colors.feedItem.secondaryText, marginBottom: 0 },
            ]}
          >
            {translations.limitationsText}
          </Text>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 28,
    textAlign: "center",
    letterSpacing: 0.1,
  },
  section: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.05,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 26,
    marginBottom: 10,
  },
  processStep: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 6,
    marginLeft: 4,
  },
});
