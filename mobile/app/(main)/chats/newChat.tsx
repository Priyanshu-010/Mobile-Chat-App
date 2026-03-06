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
      <View className="p-4 border-b">
        <Text className="text-xl font-bold">Start New Chat</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-row items-center p-4 border-b"
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
              className="w-12 h-12 rounded-full"
            />

            <View className="ml-3">
              <Text className="text-lg font-semibold">{item.username}</Text>

              <Text className="text-gray-500">{item.email}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
