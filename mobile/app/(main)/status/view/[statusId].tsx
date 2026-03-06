import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { Video } from "expo-av";

const { width } = Dimensions.get("window");
const API = "http://192.168.0.105:3000";

const Status = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext not found");

  const { token } = auth;
  const params = useLocalSearchParams();

  const statusGroupStr = params.statusGroup as string;
  const username = params.username as string;
  const isMineStr = params.isMine as string;

  const isMine = isMineStr === "true";

  // Safely parse statuses array to prevent white screen crashes
  const statuses = useMemo(() => {
    if (!statusGroupStr) return [];
    try {
      const parsed = JSON.parse(statusGroupStr);
      // Ensure it's always treated as an array even if it's a single object
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error("Error parsing status group:", error);
      return [];
    }
  }, [statusGroupStr]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const videoRef = useRef<Video>(null);

  const currentStatus = statuses[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.replace("/(main)/status");
    }
  }, [currentIndex, statuses.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      router.replace("/(main)/status");
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!currentStatus) return;

    const viewStatus = async () => {
      try {
        if (!isMine) {
          await fetch(`${API}/api/status/view/${currentStatus._id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      } catch (error) {
        console.log("Error viewing status: ", error);
      }
    };
    viewStatus();

    // Pause timer if viewers modal is open
    if (showViewers) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 10000); // 10 seconds per status

    return () => clearTimeout(timer);
  }, [currentIndex, currentStatus, showViewers, isMine, token, handleNext]);

  const handlePress = (e: any) => {
    const x = e.nativeEvent.locationX;
    if (x < width / 3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  // Fallback UI to prevent blank white screen if data is parsing or missing
  if (!currentStatus) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <TouchableOpacity
          className="absolute top-16 right-5 z-10 p-2"
          onPress={() => router.replace("/(main)/status")}
        >
          <Text className="text-white text-xl font-bold">✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black justify-center items-center">
      {/* Progress Bars */}
      <View className="absolute top-10 w-full flex-row px-2 gap-1 z-20">
        {statuses.map((_: any, index: number) => (
          <View
            key={index}
            className="flex-1 h-1 bg-gray-500 rounded-full overflow-hidden"
          >
            <View
              className={`h-full bg-white ${
                index <= currentIndex ? "w-full" : "w-0"
              }`}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View className="absolute top-16 w-full flex-row items-center justify-between px-5 z-20 pointer-events-none">
        <Text className="text-white text-lg font-bold shadow-sm">
          {username}
        </Text>
        <TouchableOpacity
          className="pointer-events-auto p-2"
          onPress={() => router.replace("/(main)/status")}
        >
          <Text className="text-white text-xl font-bold">✕</Text>
        </TouchableOpacity>
      </View>

      {/* Media Content */}
      <TouchableWithoutFeedback onPress={handlePress}>
        <View className="w-full h-full justify-center items-center bg-black">
          {currentStatus.type === "image" && (
            <Image
              source={{ uri: currentStatus.mediaUrl }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}

          {currentStatus.type === "video" && (
            <Video
              ref={videoRef}
              source={{ uri: currentStatus.mediaUrl }}
              className="w-full h-full"
              shouldPlay={!showViewers} // Pause video if viewers modal is open
              isLooping={false}
              useNativeControls={false}
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      {isMine && (
        <TouchableOpacity
          className="absolute bottom-10 w-full flex items-center z-20"
          onPress={() => setShowViewers(true)}
        >
          <Text className="text-white text-lg font-semibold tracking-widest">
            👁 {currentStatus.viewers?.length || 0}
          </Text>
          <Text className="text-white text-xs mt-1">Tap to see viewers</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showViewers} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl h-2/3 p-5">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">
                Viewed by {currentStatus.viewers?.length || 0}
              </Text>
              <TouchableOpacity onPress={() => setShowViewers(false)} className="p-2">
                <Text className="text-lg text-gray-500 font-bold">✕</Text>
              </TouchableOpacity>
            </View>

            {!currentStatus.viewers || currentStatus.viewers.length === 0 ? (
              <Text className="text-center text-gray-500 mt-10">
                No views yet
              </Text>
            ) : (
              <FlatList
                data={currentStatus.viewers}
                keyExtractor={(item: any, index) => item._id || index.toString()}
                renderItem={({ item }) => (
                  <View className="flex-row items-center gap-4 mb-4">
                    <Image
                      source={{
                        uri: item.profilePic || "https://i.pravatar.cc/150",
                      }}
                      className="w-14 h-14 rounded-full bg-gray-200"
                    />
                    <Text className="text-lg font-semibold text-gray-800">
                      {item.username || "Unknown User"}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Status;