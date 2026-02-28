import { View, ActivityIndicator } from 'react-native'
import React, { useContext, useEffect } from 'react'
import {  useRouter } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'

const Index = () => {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthContext not found");
  }

  const { user, loading } = auth;
  const router = useRouter()

  useEffect(()=>{
    if(!loading){
      if(user){
        router.replace("/(main)/chats")
      }else {
        router.replace("/(auth)/login");
      }
    }
  }, [user, loading, router])
  return (
    <View className='flex justify-center items-center min-h-screen'>
      <ActivityIndicator size="large" />
    </View>
  )
}

export default Index