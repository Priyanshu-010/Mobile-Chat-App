import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useContext } from "react";
import { Link, useRouter } from "expo-router";
import { AuthContext } from "@/context/AuthContext";

type User = {
  _id: string;
  name: string;
  email: string;
};

type LoginResponse = {
  message: string;
  user: User;
  token: string;
};

export default function Login() {
  const router = useRouter();
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthContext not found");
  }

  const { login } = auth;

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert("All fields required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://192.168.0.105:3000/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        Alert.alert(data.message || "Login failed");
        return;
      }

      await login(data.user, data.token);

      router.replace("/(main)/chats");
    } catch(error){
      console.log("Login error: ", error)
      Alert.alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-black">
      <Text className="text-white text-3xl font-bold mb-6">
        Login
      </Text>

      <TextInput
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
        onPress={handleLogin}
        className="bg-blue-600 p-4 rounded items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold">
            Login
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.push("/(auth)/register")}
        className="mt-4"
      >
        <Text className="text-gray-400 text-center">
          Dont have an account? <Link href="/register">Register</Link>
        </Text>
      </Pressable>
    </View>
  );
}