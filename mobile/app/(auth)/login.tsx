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
    } catch (error) {
      console.log("Login error: ", error);
      Alert.alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-8 bg-[#0a0a0a]">
      <View className="mb-10">
        <Text className="text-white text-4xl font-extrabold tracking-tight mb-2">
          Welcome back
        </Text>
        <Text className="text-gray-400 text-base">
          Sign in to continue to your chats
        </Text>
      </View>

      <View className="space-y-4">
        <TextInput
          keyboardType="email-address"
          placeholder="Email address"
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          className="bg-[#171717] border border-[#262626] text-white px-5 py-4 rounded-2xl text-base mb-4"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          className="bg-[#171717] border border-[#262626] text-white px-5 py-4 rounded-2xl text-base mb-6"
        />
      </View>

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        className={`bg-blue-600 py-4 rounded-2xl items-center shadow-sm shadow-blue-900/20 ${
          loading ? "opacity-70" : "active:opacity-80"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-lg">Login</Text>
        )}
      </Pressable>

      <View className="mt-8 flex-row justify-center items-center">
        <Text className="text-gray-400 text-base">Dont have an account? </Text>
        <Link href="/(auth)/register" asChild>
          <Pressable>
            <Text className="text-blue-500 font-semibold text-base">Register</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}