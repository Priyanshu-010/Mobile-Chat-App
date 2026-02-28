import { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { AuthContext } from "../../context/AuthContext";

const Chats = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthContext not found");
  }
  const { token, logout } = auth;
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  

  useEffect(() => {
    const fetchUsers = async () => {
    try {
      const response = await fetch("http://192.168.0.105:3000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.log("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };
    fetchUsers();
  }, [token]);

  const handleLogout = async()=>{
    logout();
    router.push("/(auth)/login")
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4B5563" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-4">
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="p-4 border-b-1 border-b-[#eee]"
            onPress={() =>
              router.push({
                pathname: "/chat/[userId]",
                params: { userId: item._id, name: item.name },
              })
            }
          >
            <Text className="text-xl font-semibold">{item.name}</Text>
            <Text className="text-gray-500">{item.email}</Text>
          </TouchableOpacity>
        )}
      />
      <Pressable  onPress={handleLogout} className="items-center h-20 border border-gray-500 p-3">
        <Text className="text-4xl">Logout</Text>
      </Pressable>
    </View>
  );
};

export default Chats;