import { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";

import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.0.105:3000";

let socket: any;

export default function Chats() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext not found");

  const { user, token } = auth;

  const [conversations, setConversations] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch(
          "http://192.168.0.105:3000/api/messages/conversations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();
        setConversations(data);
      } catch (err) {
        console.log("Conversation error", err);
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

    socket.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });
    return () => socket.disconnect();
  }, [token, user]);



  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row justify-between items-center p-4 border-b">
        <Text className="text-2xl font-bold">Chatty</Text>

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push("/(main)/chats/newChat")}
            className="bg-blue-500 w-12 h-12 rounded-full items-center justify-center"
          >
            <Text className="text-white text-xl">+</Text>
          </TouchableOpacity>

          
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const otherUser = item.participants.find(
            (p: any) => p._id !== user?._id,
          );

          const isOnline = onlineUsers.includes(otherUser._id);
          const isUnread = item.unreadFor === user?._id;

          return (
            <TouchableOpacity
              className="flex-row items-center p-4 border-b"
              onPress={() =>
                router.push({
                  pathname: "/(main)/chats/[userId]",
                  params: {
                    userId: otherUser._id,
                    name: otherUser.username,
                    profilePic: otherUser.profilePic
                  },
                })
              }
            >
              <Image
                source={{
                  uri: otherUser.profilePic || "https://i.pravatar.cc/100",
                }}
                className="w-12 h-12 rounded-full"
              />

              <View className="flex-1 ml-3">
                <View className="flex-row justify-between">
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
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
