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
import { AuthContext } from "../../../context/AuthContext";
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
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
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
        }
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

    // receive new messages
    socket.on("receiveMessage", () => {
      fetchConversations();
    });

    // receive online users
    socket.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users);
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
      {/* HEADER */}

      <View className="m-4 p-4 flex flex-row justify-between items-center gap-6">
        <Text className="text-2xl font-bold">Chatty</Text>

        <View className="flex flex-row justify-between items-center gap-3">
          <TouchableOpacity
            onPress={() => router.push("/(main)/chats/newChat")}
            className="bg-blue-500 w-14 h-14 rounded-full items-center justify-center shadow-lg"
          >
            <Text className="text-white text-2xl">+</Text>
          </TouchableOpacity>

          <Pressable
            onPress={handleLogout}
            className="w-auto h-auto border border-gray-500 p-3 rounded-2xl"
          >
            <Text className="text-xl">Logout</Text>
          </Pressable>
        </View>
      </View>

      {/* CHAT LIST */}

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const otherUser = item.participants.find(
            (p: any) => p._id !== user?._id
          );

          const isUnread = item.unreadFor === user?._id;
          const isOnline = onlineUsers.includes(otherUser._id);

          return (
            <TouchableOpacity
              className="p-4 border-b border-gray-200"
              onPress={() =>
                router.push({
                  pathname: "/(main)/chats/[userId]",
                  params: {
                    userId: otherUser._id,
                    name: otherUser.username,
                  },
                })
              }
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-semibold">
                    {otherUser.username}
                  </Text>

                  {isOnline && (
                    <View className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </View>

                {isUnread && (
                  <View className="w-3 h-3 bg-blue-500 rounded-full" />
                )}
              </View>

              {item.lastMessage && (
                <Text className="text-gray-500 mt-1" numberOfLines={1}>
                  {item.lastMessage.text || "Media"}
                </Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default Chats;