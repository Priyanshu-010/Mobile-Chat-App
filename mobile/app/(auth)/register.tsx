import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useContext, useState } from "react";
import { Link, useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";

type User = {
  _id: string;
  name: string;
  email: string;
};

type RegisterResponse = {
  message: string;
  user: User;
  token: string;
};

export default function Register() {
  const router = useRouter();
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthContext not found");
  }

  const { login } = auth;

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleRegister = async (): Promise<void> => {
    if (!name || !email || !password) {
      Alert.alert("All fields required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://192.168.0.105:3000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: name,
            email,
            password,
          }),
        },
      );

      const data: RegisterResponse = await response.json();

      if (!response.ok) {
        Alert.alert(data.message || "Registration failed");
        return;
      }

      await login(data.user, data.token);

      Alert.alert("Account created successfully");
      router.replace("/(main)/chats");
    } catch (error) {
      console.log("register error: ", error);
      Alert.alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-black">
      <Text className="text-white text-3xl font-bold mb-6">Register</Text>

      <TextInput
        placeholder="Name"
        placeholderTextColor="gray"
        value={name}
        onChangeText={setName}
        className="bg-gray-800 text-white p-4 rounded mb-4"
      />

      <TextInput
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor="gray"
        value={email}
        onChangeText={setEmail}
        className="bg-gray-800 text-white p-4 rounded mb-4"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="gray"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        className="bg-gray-800 text-white p-4 rounded mb-6"
      />

      <Pressable
        onPress={handleRegister}
        className="bg-blue-600 p-4 rounded items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold">Register</Text>
        )}
      </Pressable>
      <Pressable
        onPress={() => router.push("/(auth)/register")}
        className="mt-4"
      >
        <Text className="text-gray-400 text-center">
          Already have an account? <Link href="/login">Login</Link>
        </Text>
      </Pressable>
    </View>
  );
}
