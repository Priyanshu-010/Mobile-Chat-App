import { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";
import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.0.105:3000";
let socket: any;

const Chats = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthContext not found");
  }
  const { user, token, logout } = auth;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(
          "http://192.168.0.105:3000/api/messages/conversations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.log("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();

    socket = io(SOCKET_URL);

    socket.emit("join", user?._id);

    socket.on("receiveMessage", () => {
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const handleLogout = async () => {
    logout();
    router.push("/(auth)/login");
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4B5563" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const otherUser = item.participants.find(
            (p: any) => p._id !== auth.user?._id,
          );

          const isUnread = item.unreadFor === auth.user?._id;
          return (
            <TouchableOpacity
              className="p-4 border-b border-gray-200"
              onPress={() =>
                router.push({
                  pathname: "/chat/[userId]",
                  params: {
                    userId: otherUser._id,
                    name: otherUser.username,
                  },
                })
              }
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold">
                  {otherUser.username}
                </Text>

                {isUnread && (
                  <View className="w-3 h-3 bg-blue-500 rounded-full" />
                )}
              </View>

              {item.lastMessage && (
                <Text className="text-gray-500 mt-1" numberOfLines={1}>
                  {item.lastMessage.text}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
      {/* <TouchableOpacity
        onPress={() => router.push("")}
        className="absolute top-80 right-6 bg-blue-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-2xl">+</Text>
      </TouchableOpacity> */}
      <Pressable
        onPress={handleLogout}
        className="w-30 h-20 border border-gray-500 p-3"
      >
        <Text className="text-4xl">Logout</Text>
      </Pressable>
    </View>
  );
};

export default Chats;
