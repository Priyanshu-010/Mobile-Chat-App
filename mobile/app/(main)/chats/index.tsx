import { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";

import { useRouter, useFocusEffect } from "expo-router";
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

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${SOCKET_URL}/api/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.log("Conversation error", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchConversations();
      }
    }, [token, fetchConversations])
  );

  useEffect(() => {
    socket = io(SOCKET_URL);

    socket.emit("join", user?._id);

    socket.on("receiveMessage", () => {
      fetchConversations();
    });

    socket.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });
    
    return () => socket.disconnect();
  }, [token, user, fetchConversations]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row justify-between items-center px-12 pt-12 pb-4 border-b border-gray-100">
        <Text className="text-3xl font-extrabold text-gray-900">Chatty</Text>

        <TouchableOpacity
          onPress={() => router.push("/(main)/chats/newChat")}
          className="bg-blue-600 w-11 h-11 rounded-full items-center justify-center shadow-sm shadow-blue-500/30"
        >
          <Text className="text-white text-2xl leading-none -mt-1">+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const otherUser = item.participants.find(
            (p: any) => p._id !== user?._id,
          );

          if (!otherUser) return null;

          const isOnline = onlineUsers.includes(otherUser._id);
          const isUnread = item.unreadFor === user?._id;

          return (
            <TouchableOpacity
              className="flex-row items-center px-6 py-4 border-b border-gray-50 active:bg-gray-50"
              onPress={() =>
                router.push({
                  pathname: "/(main)/chats/[userId]",
                  params: {
                    userId: otherUser._id,
                    name: otherUser.username,
                    profilePic: otherUser.profilePic,
                  },
                })
              }
            >
              <View className="relative">
                <Image
                  source={{
                    uri: otherUser.profilePic || "https://i.pravatar.cc/100",
                  }}
                  className="w-14 h-14 rounded-full bg-gray-200"
                />
                {isOnline && (
                  <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                )}
              </View>

              <View className="flex-1 ml-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
                    {otherUser.username}
                  </Text>

                  {isUnread && (
                    <View className="w-3 h-3 bg-blue-600 rounded-full" />
                  )}
                </View>

                {item.lastMessage && (
                  <Text 
                    className={`text-sm ${isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`} 
                    numberOfLines={1}
                  >
                    {item.lastMessage.text || "📷 Media message"}
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