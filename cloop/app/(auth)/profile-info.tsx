import React from 'react';
import { Stack } from 'expo-router';
import ProfileInfoScreen from '../../components/ProfileInfoScreen';

export default function ProfileInfo() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: "Complete Your Profile"
        }} 
      />
      <ProfileInfoScreen />
    </>
  );
}