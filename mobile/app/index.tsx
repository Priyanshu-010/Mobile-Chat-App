import { View, Text } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const chats = () => {
  return (
    <View className='flex justify-center items-center min-h-screen'>
      <Text className='text-white text-center text-5xl font-bold'>Hello My friend</Text>
      <Link className='text-white text-center text-5xl font-bold' href="/modal">Modal</Link>
    </View>
  )
}

export default chats