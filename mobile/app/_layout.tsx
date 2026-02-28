// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

// import { useColorScheme } from "@/hooks/use-color-scheme";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "./global.css"
import { AuthProvider } from "@/context/AuthContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  // const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{headerShown: false}} />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
