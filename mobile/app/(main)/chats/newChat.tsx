import { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../../context/AuthContext";

export default function NewChatScreen() {
  const auth = useContext(AuthContext);
  const router = useRouter();

  if (!auth) throw new Error("AuthContext not found");

  const { token, user } = auth;

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(
          "http://192.168.0.105:3000/api/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        const filtered = data.filter((u: any) => u._id !== user?._id);

        setUsers(filtered);
      } catch (error) {
        console.log(error);
      }
    };

    fetchUsers();
  }, [token, user]);

  return (
    <View className="flex-1 bg-white">

      <View className="p-4 border-b border-gray-200">
        <Text className="text-xl font-bold">
          Start New Chat
        </Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="p-4 border-b border-gray-200"
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
            <Text className="text-lg font-semibold">
              {item.username}
            </Text>

            <Text className="text-gray-500">
              {item.email}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}