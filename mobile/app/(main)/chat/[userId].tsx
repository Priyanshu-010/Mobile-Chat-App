import { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AuthContext } from "../../../context/AuthContext";
import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.0.105:3000";

let socket: any;

export default function ChatScreen() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthContext not found");
  }
  const params = useLocalSearchParams();
  const userId = params.userId;
  const name = params.name;
  const { user, token } = auth;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  console.log(name);
  console.log(userId);


  useEffect(() => {
  if (!user) return;

  const fetchMessages = async () => {
    try {
      const res = await fetch(
        `http://192.168.0.105:3000/api/messages/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    setMessages((prev) => [...prev, newMessage]);
  });

  return () => {
    socket.disconnect();
  };
}, [token, user, userId]);

  const handleSend = () => {
    if (!user) return;
    if (!text.trim()) return;

    const newMessage = {
      senderId: user._id,
      receiverId: userId,
      text,
    };

    socket.emit("sendMessage", newMessage);

    setMessages((prev) => [
      ...prev,
      {
        sender: user._id,
        text,
        createdAt: new Date(),
      },
    ]);

    setText("");
  };

  return (
    <View className="flex-1 bg-white p-4 mt-2">
      {/* Header */}
      <View className="p-5 border-b border-gray-200">
        <Text className="text-lg font-bold">{name}</Text>
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
                <Text className={`${isMe ? "text-white" : "text-black"}`}>
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View className="flex-row items-center p-3 border-t border-gray-200">
        <TextInput
          value={text}
          onChangeText={setText}
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
  );
}
