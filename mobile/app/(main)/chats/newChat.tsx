import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";

export default function NewChatScreen() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext not found");

  const { token, user } = auth;

  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("http://192.168.0.105:3000/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        const filtered = data.filter((u: any) => u._id !== user?._id);

        setUsers(filtered);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUsers();
  }, [token, user]);

  return (
    <View className="flex-1 bg-white">
      <View className="px-12 pt-12 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-extrabold text-gray-900">Start New Chat</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center px-6 py-4 border-b border-gray-50 active:bg-gray-50"
            onPress={() =>
              router.push({
                pathname: "/(main)/chats/[userId]",
                params: {
                  userId: item._id,
                  name: item.username,
                },
              })
            }
          >
            <Image
              source={{
                uri: item.profilePic || "https://i.pravatar.cc/100",
              }}
              className="w-12 h-12 rounded-full bg-gray-200"
            />

            <View className="ml-4 flex-1">
              <Text className="text-base font-semibold text-gray-900 mb-0.5">
                {item.username}
              </Text>
              <Text className="text-sm text-gray-500" numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}