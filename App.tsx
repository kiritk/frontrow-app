import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';

import EventsScreen from './src/screens/EventsScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS, FONTS } from './src/theme/colors';

const Tab = createBottomTabNavigator();

// Custom ticket icon component
function TicketIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: size * 0.85,
        height: size * 0.6,
        borderWidth: 2,
        borderColor: color,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: size * 0.2, height: size * 0.2, backgroundColor: color, borderRadius: 2 }} />
        </View>
        <View style={{
          height: '100%',
          borderLeftWidth: 1.5,
          borderColor: color,
          borderStyle: 'dashed',
        }} />
        <View style={{ width: size * 0.25, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: size * 0.1, height: size * 0.1, backgroundColor: color, borderRadius: 1 }} />
        </View>
      </View>
    </View>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 20,
          right: 90,
          height: 64,
          backgroundColor: COLORS.white,
          borderRadius: 32,
          shadowColor: COLORS.navy,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          borderTopWidth: 0,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarActiveTintColor: COLORS.navy,
        tabBarInactiveTintColor: COLORS.grayLight,
        tabBarLabelStyle: {
          fontFamily: FONTS.medium,
          fontSize: 11,
          marginTop: -2,
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
      }}
    >
      <Tab.Screen 
        name="Events" 
        component={EventsScreen} 
        options={{ 
          tabBarLabel: 'Events',
          tabBarIcon: ({ color, size }) => <TicketIcon color={color} size={size} />,
        }} 
      />
      <Tab.Screen 
        name="Stats" 
        component={StatsScreen} 
        options={{ 
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }} 
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { session, loading } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.navy} /></View>;
  return <NavigationContainer>{session ? <TabNavigator /> : <AuthScreen />}</NavigationContainer>;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  if (!fontsLoaded) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.navy} /></View>;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream },
});
