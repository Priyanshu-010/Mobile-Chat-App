import { AuthContext } from "@/context/AuthContext";
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadToCloudinary } from "@/services/cloudinary";

export default function StatusScreen() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext not found");

  const { token, user } = auth;
  // console.log(user?.profilePic)

  const [status, setStatus] = useState([]);
  const [myStatuses, setMyStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = "http://192.168.0.105:3000";

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://192.168.0.105:3000/api/status/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      const myRes = await fetch(`${API}/api/status/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const myData = await myRes.json();
      setStatus(data)
      setMyStatuses(myData)
    } catch (error) {
      console.log("Error in useEffect fetching status: ", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchStatus = async () => {
    try {
      const res = await fetch("http://192.168.0.105:3000/api/status/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.log("Error in useEffect fetching status: ", error);
    } finally {
      setLoading(false);
    }
  };
    fetchStatus();
  }, [token]);

  const pickStatusMedia = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      videoMaxDuration: 30,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    const type = asset.type === "video" ? "video" : "image";

    uploadStatus(asset.uri, type);
  };

   const uploadStatus = async (uri: string, type: string) => {
    try {
      setLoading(true);

      const mediaUrl = await uploadToCloudinary(uri);

      if (!mediaUrl) {
        Alert.alert("Upload failed");
        return;
      }

      await fetch(`${API}/api/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mediaUrl,
          type,
        }),
      });

      Alert.alert("Status uploaded");

      fetchStatus();
    } catch (error) {
      console.log("Upload status error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }
  return (
    <View className="flex-1 py-8">

      <TouchableOpacity
        className="flex-row items-center p-4 gap-3 border-b border-gray-200"
        onPress={pickStatusMedia}
      >
        <Image
          source={{
            uri: user?.profilePic || "https://i.pravatar.cc/150",
          }}
          className="w-20 h-20 rounded-full"
        />

        <View>
          <Text className="text-lg font-semibold">My Status</Text>
          <Text className="text-gray-500 text-sm">
            Tap to add status
          </Text>
        </View>
      </TouchableOpacity>

      {status.length === 0 ? (
        <Text>No one has uploaded any status</Text>
      ) : (
        <FlatList
          data={status}
          keyExtractor={(item: any) => item._id}
          renderItem={({ item }) => {
            // console.log(item);
            return (
              <TouchableOpacity
                className="flex-row items-center p-4 gap-2"
                onPress={() =>
                  router.push({
                    pathname: "/(main)/status/view/[statusId]",
                    params: {
                      statusId: item._id,
                      mediaUrl: item.mediaUrl,
                      type: item.type,
                      username: item.user.username,
                    },
                  })
                }
              >
                <Image
                  source={{
                    uri: item.user.profilePic || "https://i.pravatar.cc/100",
                  }}
                  className="w-20 h-20 rounded-full border border-green-400"
                />
                <View>
                  <Text className="text-lg font-semibold">
                    {item.user.username}
                  </Text>
                   <Text className="text-gray-500 text-sm">
                    Tap to view status
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
