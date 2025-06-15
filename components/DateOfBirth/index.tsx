import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Controller } from "react-hook-form";
import { Text } from "@/components/ui/text";
import DatePicker from "react-native-date-picker";
import { parse, format } from "date-fns";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { FontSizes, useTheme } from "@/lib/theme";
import { Calendar } from "lucide-react-native";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function DateOfBirth({ control }: { control: any }) {
  const [open, setOpen] = useState(false);
  const pressed = useSharedValue(0);
  const colorScheme = useColorScheme();
  const theme = useTheme();

  const formatDate = (dateString: string) => {
    return parse(dateString, "dd/MM/yyyy", new Date());
  };

  const formatDateToString = (date: Date) => {
    return format(date, "dd/MM/yyyy");
  };

  const currentDate = new Date();
  const pastDate = new Date(
    currentDate.setFullYear(currentDate.getFullYear() - 12)
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withTiming(1 - pressed.value * 0.05, { duration: 100 }) },
      ],
      backgroundColor: interpolateColor(
        pressed.value,
        [0, 1],
        [
          colorScheme === "dark" ? "#1e1e1e" : theme.colors.card.background,
          colorScheme === "dark" ? "#2a2a2a" : theme.colors.border,
        ]
      ),
    };
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="date_of_birth"
        render={({ field: { onChange, value } }) => (
          <>
            <AnimatedTouchable
              style={[
                styles.button,
                animatedStyle,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "#1e1e1e"
                      : theme.colors.card.background,
                  shadowColor:
                    colorScheme === "dark" ? "#000" : "rgba(0,0,0,0.2)",
                },
              ]}
              onPress={() => setOpen(true)}
              onPressIn={() => {
                pressed.value = withTiming(1, {
                  duration: 150,
                  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                });
              }}
              onPressOut={() => {
                pressed.value = withTiming(0, {
                  duration: 200,
                  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                });
              }}
            >
              <View style={styles.innerContainer}>
                <Calendar
                  size={20}
                  color={colorScheme === "dark" ? "#d1d5db" : theme.colors.text}
                  style={styles.icon}
                />
                <Text
                  style={[
                    styles.dateText,
                    {
                      color:
                        colorScheme === "dark" ? "#d1d5db" : theme.colors.text,
                    },
                  ]}
                >
                  {value
                    ? `${formatDateToString(formatDate(value))}`
                    : "დაბადების თარიღი"}
                </Text>
              </View>
              <Text
                style={[
                  styles.actionText,
                  {
                    color:
                      colorScheme === "dark" ? "#a1a1aa" : theme.colors.primary,
                  },
                ]}
              >
                {value ? "შეცვლა" : "არჩევა"}
              </Text>
            </AnimatedTouchable>
            <DatePicker
              modal
              title="დაბადების თარიღი"
              buttonColor={
                colorScheme === "dark" ? "white" : theme.colors.primary
              }
              mode="date"
              locale="ka"
              theme={colorScheme === "dark" ? "dark" : "light"}
              confirmText="დადასტურება"
              cancelText="გაუქმება"
              open={open}
              minimumDate={new Date(1940, 1, 1)}
              maximumDate={pastDate}
              date={value ? formatDate(value) : new Date(2000, 1, 1)}
              onConfirm={(date) => {
                setOpen(false);
                onChange(formatDateToString(date));
              }}
              onCancel={() => {
                setOpen(false);
              }}
            />
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginTop: 4,
  },
  button: {
    width: "100%",
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderRadius: 10,
    boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.5)",
  },
  innerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: FontSizes.medium,
    fontWeight: "500",
  },
  actionText: {
    fontSize: FontSizes.medium,
    fontWeight: "600",
  },
});
