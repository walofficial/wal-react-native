import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import UserLogin from "../UserLogin";
import { useRef } from "react";
import BottomSheet, { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

export default function HomePage() {
  const userLoginRef = useRef<BottomSheet>(null);

  return (
    <BottomSheetModalProvider>
      <View className="flex flex-row items-center justify-center bg-black flex-1 p-4">
        <View className="py-6 px-2 space-y-6">
          <Text className="text-4xl font-bold text-white">MNT</Text>
          <View className="relative py-0 h-48 flex-1 flex-row">
            <Svg className="w-full" viewBox="0 0 200 200">
              {/* Outer circle */}
              <Circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Inner arc on the left */}
              <Path
                d="M75,135 A55,55 0 0,1 75,65"
                fill="none"
                stroke="#EC4899"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Smaller arc inside the left arc */}
              <Path
                d="M85,125 A40,40 0 0,1 85,75"
                fill="none"
                stroke="#EC4899"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Inner arc on the right */}
              <Path
                d="M125,65 A55,55 0 0,1 125,135"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Smaller arc inside the right arc */}
              <Path
                d="M115,75 A40,40 0 0,1 115,125"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </Svg>
          </View>

          <View className="space-y-2">
            <Text className="text-3xl mb-3 font-bold text-white">
              რა ხდება?
            </Text>
            <Text className="text-lg mb-3 text-gray-300">
              შეურთდი ლოკაციაზე მყოფ ადამიანებს და გამოქვეყნეთ თქვენი საუკეთესო
              მომენტები
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              userLoginRef.current?.snapToIndex(0);
            }}
            style={{ backgroundColor: "#efefef" }}
            className="flex flex-row rounded-xl justify-center items-center shadow-pink-600 mt-3 w-full shadow-sm p-4"
          >
            <Text className="text-black text-xl font-semibold">შესვლა</Text>
          </TouchableOpacity>
        </View>
      </View>
      <UserLogin ref={userLoginRef} />
    </BottomSheetModalProvider>
  );
}
