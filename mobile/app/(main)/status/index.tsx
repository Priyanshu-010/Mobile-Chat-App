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

  const [status, setStatus] = useState<any[]>([]);
  const [myStatuses, setMyStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const API = "http://192.168.0.105:3000";

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API}/api/status/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      const myRes = await fetch(`${API}/api/status/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const myData = await myRes.json();

      if (Array.isArray(data)) {
        const grouped = data.reduce((acc: any, currentStatus: any) => {
          const userId = currentStatus.user._id;
          if (!acc[userId]) {
            acc[userId] = {
              user: currentStatus.user,
              statuses: [],
            };
          }
          acc[userId].statuses.push(currentStatus);
          return acc;
        }, {});
        setStatus(Object.values(grouped));
      }

      if (Array.isArray(myData)) {
        setMyStatuses(myData);
      }
    } catch (error) {
      console.log("Error in fetching status: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API}/api/status/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        const myRes = await fetch(`${API}/api/status/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myData = await myRes.json();

        if (Array.isArray(data)) {
          const grouped = data.reduce((acc: any, currentStatus: any) => {
            const userId = currentStatus.user._id;
            if (!acc[userId]) {
              acc[userId] = {
                user: currentStatus.user,
                statuses: [],
              };
            }
            acc[userId].statuses.push(currentStatus);
            return acc;
          }, {});
          setStatus(Object.values(grouped));
        }

        if (Array.isArray(myData)) {
          setMyStatuses(myData);
        }
      } catch (error) {
        console.log("Error in fetching status: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [token]);

  const pickStatusMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

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
      {/* My Status Section */}
      <View className="flex-row items-center p-4 gap-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => {
            if (myStatuses.length > 0) {
              router.push({
                pathname: "/(main)/status/view/[statusId]",
                params: {
                  statusId: myStatuses[0]._id,
                  statusGroup: JSON.stringify(myStatuses),
                  username: "My Status",
                  isMine: "true",
                },
              });
            } else {
              pickStatusMedia();
            }
          }}
        >
          <View className="relative">
            <Image
              source={{
                uri: user?.profilePic || "https://i.pravatar.cc/150",
              }}
              className="w-20 h-20 rounded-full"
            />
            {/* Add status icon */}
            <TouchableOpacity
              className="absolute bottom-0 right-0 bg-green-500 rounded-full w-7 h-7 justify-center items-center border-2 border-white"
              onPress={pickStatusMedia}
            >
              <Text className="text-white font-bold text-lg leading-tight pb-0.5">
                +
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-lg font-semibold">My Status</Text>
          <Text className="text-gray-500 text-sm">
            {myStatuses.length > 0
              ? "Tap to view your status"
              : "Tap to add status updates"}
          </Text>
        </View>
      </View>

      {/* Other Users' Statuses */}
      <View className="p-4 bg-gray-50">
        <Text className="text-gray-500 font-semibold">Recent updates</Text>
      </View>

      {status.length === 0 ? (
        <View className="p-4 items-center">
          <Text className="text-gray-500">No recent updates</Text>
        </View>
      ) : (
        <FlatList
          data={status}
          keyExtractor={(item: any) => item.user._id}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                className="flex-row items-center p-4 gap-3"
                onPress={() =>
                  router.push({
                    pathname: "/(main)/status/view/[statusId]",
                    params: {
                      statusId: item.statuses[0]._id,
                      statusGroup: JSON.stringify(item.statuses),
                      username: item.user.username,
                      isMine: "false",
                    },
                  })
                }
              >
                <View className="p-0.5 border-2 border-green-500 rounded-full">
                  <Image
                    source={{
                      uri: item.user.profilePic || "https://i.pravatar.cc/100",
                    }}
                    className="w-16 h-16 rounded-full"
                  />
                </View>
                <View>
                  <Text className="text-lg font-semibold">
                    {item.user.username}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {item.statuses.length} update
                    {item.statuses.length > 1 ? "s" : ""}
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
