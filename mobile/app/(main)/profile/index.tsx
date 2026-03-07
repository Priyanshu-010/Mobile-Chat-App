import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useContext, useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { AuthContext } from "../../../context/AuthContext";
import { uploadToCloudinary } from "../../../services/cloudinary";
import { router } from "expo-router";

export default function ProfileScreen() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext not found");

  const { token, logout } = auth;

  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePic, setProfilePic] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
    try {
      const res = await fetch("http://192.168.0.105:3000/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setUser(data);
      setUsername(data.username || "");
      setBio(data.bio || "");
      setProfilePic(data.profilePic || "");
    } catch (error) {
      console.log("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };
    fetchProfile();
  }, [token]);

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required to access gallery");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      setUploading(true);

      const url = await uploadToCloudinary(result.assets[0].uri);

      setUploading(false);

      if (url) {
        setProfilePic(url);
      } else {
        Alert.alert("Upload failed");
      }
    }
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);

      const res = await fetch("http://192.168.0.105:3000/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          bio,
          profilePic,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Error", data.message);
        return;
      }

      setUser(data.user);
      Alert.alert("Success", "Profile updated");
    } catch (error) {
      console.log("Update error:", error);
      Alert.alert("Update failed");
    } finally {
      setUpdating(false);
    }
  };
    const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-12">
      <View className="items-center">
        <TouchableOpacity onPress={pickImage}>
          {uploading ? (
            <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center">
              <ActivityIndicator />
            </View>
          ) : (
            <Image
              source={{
                uri:
                  profilePic ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              }}
              className="w-28 h-28 rounded-full"
            />
          )}
        </TouchableOpacity>

        <Text className="text-gray-500 mt-2 text-sm">
          Tap to change profile photo
        </Text>
      </View>

      <View className="mt-10">
        <Text className="text-gray-500 mb-1">Email</Text>

        <Text className="text-lg font-semibold">
          {user?.email}
        </Text>
      </View>

      <View className="mt-6">
        <Text className="text-gray-500 mb-1">Username</Text>

        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          className="border border-gray-300 rounded-xl px-4 py-3"
        />
      </View>

      <View className="mt-6">
        <Text className="text-gray-500 mb-1">Bio</Text>

        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Write your bio"
          multiline
          className="border border-gray-300 rounded-xl px-4 py-3 h-24"
        />
      </View>

      <TouchableOpacity
        onPress={handleUpdate}
        disabled={updating}
        className="bg-green-500 mt-8 py-4 rounded-xl items-center"
      >
        {updating ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">
            Update Profile
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        className="mt-6 py-4 rounded-xl items-center border border-red-400"
      >
        <Text className="text-red-500 font-semibold">
          Logout
        </Text>
      </TouchableOpacity>

      <View className="h-24" />
    </ScrollView>
  );
}