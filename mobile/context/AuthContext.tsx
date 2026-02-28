import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  _id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: User, userToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: {children : ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser) as User);
        setToken(storedToken);
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);

    await AsyncStorage.setItem("user", JSON.stringify(userData));
    await AsyncStorage.setItem("token", userToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};