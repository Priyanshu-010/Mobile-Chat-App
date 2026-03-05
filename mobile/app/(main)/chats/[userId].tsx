import { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { useLocalSearchParams } from "expo-router";
import { AuthContext } from "../../../context/AuthContext";
import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.0.105:3000";

let socket: any;

export default function ChatScreen() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext not found");

  const params = useLocalSearchParams();
  const userId: any = params.userId;
  const name: any = params.name;

  const { user, token } = auth;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://192.168.0.105:3000/api/messages/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.log("Fetch messages error:", error);
      }
    };

    fetchMessages();

    socket = io(SOCKET_URL);

    socket.emit("join", user._id);

    socket.on("receiveMessage", (newMessage: any) => {
      if (
        newMessage.sender === userId ||
        newMessage.sender === user?._id
      ) {
        setMessages((prev) => [...prev, newMessage]);

        if (newMessage.sender === userId) {
          socket.emit("markAsRead", { messageId: newMessage._id });
        }
      }
    });

    socket.on("typing", () => {
      setTyping(true);
    });

    socket.on("stopTyping", () => {
      setTyping(false);
    });

    socket.on("messageRead", (messageId: string) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, status: "read" } : msg
        )
      );
    });

    return () => socket.disconnect();
  }, [token, user, userId]);

  const handleSend = () => {
    if (!text.trim()) return;

    const newMessage = {
      senderId: user?._id,
      receiverId: userId,
      text,
    };

    socket.emit("sendMessage", newMessage);

    setText("");
  };

  const handleTyping = (value: string) => {
    setText(value);

    socket.emit("typing", { receiverId: userId });

    setTimeout(() => {
      socket.emit("stopTyping", { receiverId: userId });
    }, 1000);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const renderStatus = (msg: any) => {
    if (msg.sender !== user?._id) return null;

    if (msg.status === "read") return "✓✓";
    if (msg.status === "delivered") return "✓✓";
    return "✓";
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 p-4 bg-white">

        {/* Header */}
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-bold">{name}</Text>
          {typing && (
            <Text className="text-gray-500 text-sm">
              typing...
            </Text>
          )}
        </View>

        {/* Messages */}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => {
            const isMe = item.sender === user?._id;

            return (
              <View className={`mb-3 ${isMe ? "items-end" : "items-start"}`}>
                <View
                  className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                    isMe
                      ? "bg-blue-500 rounded-br-none"
                      : "bg-gray-200 rounded-bl-none"
                  }`}
                >
                  <Text className={isMe ? "text-white" : "text-black"}>
                    {item.text}
                  </Text>

                  <View className="flex-row justify-end items-center mt-1 gap-1">
                    <Text className="text-xs text-gray-200">
                      {formatTime(item.createdAt)}
                    </Text>

                    {isMe && (
                      <Text className="text-xs text-gray-200">
                        {renderStatus(item)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Input */}

        <View className="flex-row items-center p-3 border-t border-gray-200">
          <TextInput
            value={text}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2"
          />

          <TouchableOpacity
            onPress={handleSend}
            className="ml-2 bg-blue-500 px-4 py-2 rounded-full"
          >
            <Text className="text-white font-semibold">Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}