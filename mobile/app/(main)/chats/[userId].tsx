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
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";

import { useLocalSearchParams } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { uploadToCloudinary } from "../../../services/cloudinary";
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
          `http://192.168.0.105:3000/api/messages/${userId}`,
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

  /* ---------------- TEXT MESSAGE ---------------- */

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

  /* ---------------- IMAGE MESSAGE ---------------- */

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

  /* ---------------- VOICE RECORDING ---------------- */

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

  /* ---------------- PLAY VOICE ---------------- */

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

  /* ---------------- UTILITIES ---------------- */

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
      <View className="flex-1 bg-white">
        {/* HEADER */}

        <View className="p-4 border-b">
          <Image
                source={{
                  uri: profilePic || "https://i.pravatar.cc/100",
                }}
                className="w-12 h-12 rounded-full"
              />
          <Text className="text-lg font-bold">{name}</Text>

          {typing ? (
            <Text className="text-green-600 text-sm">typing...</Text>
          ) : isOnline ? (
            <Text className="text-green-600 text-sm">online</Text>
          ) : (
            <Text className="text-gray-400 text-sm">offline</Text>
          )}
          {isOnline && <View className="w-3 h-3 bg-green-500 rounded-full" />}
        </View>

        {/* MESSAGES */}

        {loadingMessages ? (
          <View className="flex-1 justify-center items-center">
            <Text>Loading chat...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const isMe = item.sender === user?._id;

              return (
                <View className={`mb-3 ${isMe ? "items-end" : "items-start"}`}>
                  <View
                    className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                      isMe ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  >
                    {/* IMAGE */}

                    {item.type === "image" && item.mediaUrl && (
                      <Image
                        source={{ uri: item.mediaUrl }}
                        className="w-48 h-48 rounded-lg mb-2"
                      />
                    )}

                    {/* AUDIO */}

                    {item.type === "voice" && (
                      <TouchableOpacity
                        onPress={() => playAudio(item.mediaUrl, item._id)}
                        className="bg-black/10 px-4 py-2 rounded-lg"
                      >
                        <Text>
                          {playingId === item._id
                            ? "Playing..."
                            : "▶ Play voice"}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* TEXT */}

                    {item.text && (
                      <Text className={isMe ? "text-white" : "text-black"}>
                        {item.text}
                      </Text>
                    )}

                    {/* TIME + STATUS */}

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
        )}

        {/* INPUT BAR */}

        <View className="flex-row items-center p-3 border-t">
          {/* IMAGE */}

          <TouchableOpacity onPress={pickImage} className="px-2">
            <Text className="text-xl">📎</Text>
          </TouchableOpacity>

          {/* VOICE */}

          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecording}
            className="px-2"
          >
            <Text className="text-xl">{recording ? "🎙️..." : "🎤"}</Text>
          </TouchableOpacity>

          {/* TEXT */}

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
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 ml-2"
          />

          {/* SEND */}

          <TouchableOpacity
            onPress={sendText}
            className="ml-2 bg-blue-500 px-4 py-2 rounded-full"
          >
            <Text className="text-white font-semibold">Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
