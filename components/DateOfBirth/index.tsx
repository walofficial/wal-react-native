import React, { useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Controller } from "react-hook-form";
import { Text } from "@/components/ui/text";
import DatePicker from "react-native-date-picker";
import { Button } from "../ui/button";

export default function DateOfBirth({ control }: { control: any }) {
  const [open, setOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const [day, month, year] = dateString.split("/");
    return new Date(`${year}-${month}-${day}`);
  };

  const formatDateToString = (date: Date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const getAge = (dateString: string) => {
    const today = new Date();
    const birthDate = formatDate(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const currentDate = new Date();

  // Subtract 10 years from the current year
  const pastDate = new Date(
    currentDate.setFullYear(currentDate.getFullYear() - 12)
  );

  return (
    <View className="flex-row">
      <Controller
        control={control}
        name="date_of_birth"
        render={({ field: { onChange, value } }) => (
          <>
            <TouchableOpacity
              className="w-full h-14 flex-row items-center justify-between px-4 border border-gray-700 rounded-lg"
              onPress={() => setOpen(true)}
            >
              <Text className="text-lg text-gray-300">
                {value
                  ? `${formatDate(value).toLocaleDateString("en-US")}`
                  : "დაბადების თარიღი"}
              </Text>
              <Text className="text-lg text-blue-500">
                {value ? "შეცვლა" : "არჩევა"}
              </Text>
            </TouchableOpacity>
            <DatePicker
              modal
              title="დაბადების თარიღი"
              buttonColor="white"
              mode="date"
              locale="ka"
              theme="dark"
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
