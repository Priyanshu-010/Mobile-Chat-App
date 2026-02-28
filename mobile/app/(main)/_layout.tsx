import React from 'react'
import { Stack } from 'expo-router'

const Layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="chats" />
      <Stack.Screen name="chat/[userId]" />
    </Stack>
  )
}

export default Layout