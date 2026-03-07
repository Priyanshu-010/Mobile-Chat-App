import { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";

import { useLocalSearchParams } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { uploadToCloudinary } from "@/services/cloudinary";
import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.0.105:3000";

let socket: any;

export default function ChatScreen() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext not found");

  const { user, token } = auth;

  const params = useLocalSearchParams();
  const userId: any = params.userId;
  const name: any = params.name;
  const profilePic: any = params.profilePic;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setMessages([]);
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${SOCKET_URL}/api/messages/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setLoadingMessages(true);

        const data = await res.json();

        setMessages(data);
        setLoadingMessages(false);
      } catch (err) {
        console.log(err);
      }
    };

    fetchMessages();

    socket = io(SOCKET_URL);

    socket.emit("join", user?._id);

    socket.on("receiveMessage", (msg: any) => {
      if (msg.sender === userId || msg.sender === user?._id) {
        setMessages((prev) => [...prev, msg]);

        if (msg.sender === userId) {
          socket.emit("markAsRead", { messageId: msg._id });
          // Background fetch to ensure conversation DB unread flag clears if message received while in chat
          fetch(`${SOCKET_URL}/api/messages/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => console.log(err));
        }
      }
    });

    socket.on("onlineUsers", (users: string[]) => {
      setIsOnline(users.includes(userId));
    });

    socket.on("typing", () => setTyping(true));
    socket.on("stopTyping", () => setTyping(false));

    socket.on("messageRead", (messageId: string) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: "read" } : m)),
      );
    });

    return () => socket.disconnect();
  }, [token, user, userId]);

  useEffect(() => {
    if (!loadingMessages && messages.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      });
    }
  }, [messages, loadingMessages]);

  const sendText = () => {
    if (!text.trim()) return;

    socket.emit("sendMessage", {
      senderId: user?._id,
      receiverId: userId,
      text,
      type: "text",
    });

    setText("");
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });

      if (result.canceled) return;

      const localUri = result.assets[0].uri;

      const cloudUrl = await uploadToCloudinary(localUri);

      if (!cloudUrl) return;

      socket.emit("sendMessage", {
        senderId: user?._id,
        receiverId: userId,
        type: "image",
        mediaUrl: cloudUrl,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();

      await rec.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      await rec.startAsync();

      setRecording(rec);
    } catch (err) {
      console.log("Error in start recording: ", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();

      setRecording(null);
      if (!uri) return;

      const cloudUrl = await uploadToCloudinary(uri);

      console.log(cloudUrl);
      if (!cloudUrl) return;

      socket.emit("sendMessage", {
        senderId: user?._id,
        receiverId: userId,
        type: "voice",
        mediaUrl: cloudUrl,
      });

      setRecording(null);
    } catch (err) {
      console.log("Error in stop recording", err);
    }
  };

  const playAudio = async (url: string, id: string) => {
    try {
      setPlayingId(id);

      const { sound } = await Audio.Sound.createAsync({ uri: url });

      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (err) {
      console.log(err);
    }
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
      <View className="flex-1 bg-gray-50">
        <View className="flex-row items-center px-4 pt-8 pb-4 bg-white border-b border-gray-100 z-10">
          <Image
            source={{
              uri: profilePic || "https://i.pravatar.cc/100",
            }}
            className="w-10 h-10 rounded-full bg-gray-200"
          />
          <View className="ml-3 flex-1">
            <Text className="text-lg font-bold text-gray-900">{name}</Text>
            
            <View className="flex-row items-center">
              {isOnline && !typing && (
                <View className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
              )}
              {typing ? (
                <Text className="text-blue-600 text-xs font-medium">typing...</Text>
              ) : isOnline ? (
                <Text className="text-gray-500 text-xs font-medium">Online</Text>
              ) : (
                <Text className="text-gray-400 text-xs">Offline</Text>
              )}
            </View>
          </View>
        </View>

        {loadingMessages ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            renderItem={({ item }) => {
              const isMe = item.sender === user?._id;

              return (
                <View className={`mb-3 ${isMe ? "items-end" : "items-start"}`}>
                  <View
                    className={`px-4 py-3 rounded-2xl max-w-[80%] shadow-sm ${
                      isMe ? "bg-blue-600 rounded-tr-sm" : "bg-white border border-gray-100 rounded-tl-sm"
                    }`}
                  >
                    {item.type === "image" && item.mediaUrl && (
                      <Image
                        source={{ uri: item.mediaUrl }}
                        className="w-48 h-48 rounded-xl mb-2"
                      />
                    )}

                    {item.type === "voice" && (
                      <TouchableOpacity
                        onPress={() => playAudio(item.mediaUrl, item._id)}
                        className={`px-4 py-2.5 rounded-xl flex-row items-center ${
                          isMe ? "bg-blue-700/50" : "bg-gray-100"
                        }`}
                      >
                        <Text className="mr-2">{playingId === item._id ? "⏸️" : "▶️"}</Text>
                        <Text className={`font-medium ${isMe ? "text-white" : "text-gray-800"}`}>
                          {playingId === item._id
                            ? "Playing..."
                            : "Voice Message"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {item.text && (
                      <Text className={`text-base ${isMe ? "text-white" : "text-gray-800"}`}>
                        {item.text}
                      </Text>
                    )}

                    <View className="flex-row justify-end items-center mt-1.5 gap-1">
                      <Text className={`text-[10px] ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                        {formatTime(item.createdAt)}
                      </Text>

                      {isMe && (
                        <Text className="text-[10px] text-blue-100">
                          {renderStatus(item)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View className="flex-row items-center px-3 py-2 bg-white border-t border-gray-100 pb-6">
          <TouchableOpacity onPress={pickImage} className="p-2 mr-1 rounded-full active:bg-gray-100">
            <Text className="text-2xl">📎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
            className={`p-2 mr-2 rounded-full items-center justify-center ${
              recording ? "bg-red-100" : "active:bg-gray-100"
            }`}
          >
            <Text className="text-2xl">{recording ? "🎙️" : "🎤"}</Text>
          </TouchableOpacity>

          <TextInput
            value={text}
            onChangeText={(v) => {
              setText(v);

              socket.emit("typing", { receiverId: userId });

              setTimeout(() => {
                socket.emit("stopTyping", {
                  receiverId: userId,
                });
              }, 1000);
            }}
            placeholder="Message..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-gray-100 text-gray-900 rounded-full px-4 py-3 text-base border border-gray-200"
          />

          <TouchableOpacity
            onPress={sendText}
            className="ml-2 bg-blue-600 px-5 py-3 rounded-full shadow-sm shadow-blue-500/30"
          >
            <Text className="text-white font-bold text-sm">Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}