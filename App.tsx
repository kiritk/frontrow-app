import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { Audiowide_400Regular } from '@expo-google-fonts/audiowide';

import EventsScreen from './src/screens/EventsScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import AddEventButton from './src/components/AddEventButton';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS, FONTS } from './src/theme/colors';

const Tab = createBottomTabNavigator();

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
        <View style={{ height: '100%', borderLeftWidth: 1.5, borderColor: color, borderStyle: 'dashed' }} />
        <View style={{ width: size * 0.25, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: size * 0.1, height: size * 0.1, backgroundColor: color, borderRadius: 1 }} />
        </View>
      </View>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  const icons: { [key: string]: (color: string, size: number) => React.ReactNode } = {
    Events: (color, size) => <TicketIcon color={color} size={size} />,
    Stats: (color, size) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
    Profile: (color, size) => <Ionicons name="person-outline" size={size} color={color} />,
  };

  return (
    <View style={[styles.tabBarWrapper, { bottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const color = isFocused ? COLORS.navy : COLORS.grayLight;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
            >
              {icons[route.name](color, 24)}
              <Text style={[styles.tabLabel, { color }]}>{route.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function TabNavigatorWithFAB() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  const handleEventAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Events">
          {() => <EventsScreen key={refreshKey} />}
        </Tab.Screen>
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <AddEventButton onEventAdded={handleEventAdded} />
    </View>
  );
}

function AppContent() {
  const { session, loading } = useAuth();
  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={COLORS.navy} /></View>;
  return <NavigationContainer>{session ? <TabNavigatorWithFAB /> : <AuthScreen />}</NavigationContainer>;
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
    Audiowide_400Regular,
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
  tabBarWrapper: {
    position: 'absolute',
    left: 20,
    right: 90,
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 32,
    height: 64,
    paddingHorizontal: 8,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    marginTop: 4,
  },
});
