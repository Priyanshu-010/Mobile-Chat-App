import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { useContext, useEffect, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { AuthContext } from "@/context/AuthContext";
import { Video } from "expo-av";

const Status = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext not found");

  const { token } = auth;
  const params = useLocalSearchParams();
  
  const statusId = params.statusId as string;
  const mediaUrl = params.mediaUrl as string;
  const type = params.type as string;
  const username = params.username as string;

  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const viewStatus = async () => {
      try {
        await fetch(
          `http://192.168.0.105:3000/api/status/view/${statusId}`,
          {
            method: "PUT",
            headers:{
              Authorization: `Bearer ${token}`
            }
          }
        );
      } catch (error) {
        console.log("Error in useEffect view status: ", error);
      }
    };
    viewStatus();

    const timer = setTimeout(() => {
      router.replace("/(main)/status")
    }, 10000);

    return () => clearTimeout(timer);
  });

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <View className="absolute top-16 left-5 z-10">
        <Text className="text-white text-lg font-semibold">
          {username}
        </Text>
      </View>
      <TouchableOpacity
        className="absolute top-16 right-5 z-10"
        onPress={() => router.replace("/(main)/status")}
      >
        <Text className="text-white text-xl">X</Text>
      </TouchableOpacity>

      {type === "image" && (
        <Image
          source={{ uri: mediaUrl }}
          className="w-full h-full"
          resizeMode="contain"
        />
      )}

      {type === "video" && (
        <Video
          ref={videoRef}
          source={{ uri: mediaUrl }}
          className="w-full h-full"
          // resizeMode="contain"
          shouldPlay
          isLooping={false}
          useNativeControls={false}
        />
      )}
    </View>
  );
};

export default Status;
