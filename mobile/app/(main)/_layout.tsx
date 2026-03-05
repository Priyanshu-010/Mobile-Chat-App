import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
      }}
    >
      <Tabs.Screen
        name="chats/index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="status/index"
        options={{
          title: "Status",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-button-on-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chats/newChat"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="chats/[userId]"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="status/view/[statusId]"
        options={{ href: null }}
      />
    </Tabs>
  );
}