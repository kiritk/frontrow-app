import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Audiowide_400Regular } from '@expo-google-fonts/audiowide';
import { Limelight_400Regular } from '@expo-google-fonts/limelight';
import { Modak_400Regular } from '@expo-google-fonts/modak';
import { Iceland_400Regular } from '@expo-google-fonts/iceland';
import { Zain_400Regular } from '@expo-google-fonts/zain';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/context/AuthContext';
import EventsScreen from './src/screens/EventsScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import AddEventButton from './src/components/AddEventButton';
import { COLORS, FONTS } from './src/theme/colors';

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';
          if (route.name === 'Events') {
            iconName = isFocused ? 'ticket' : 'ticket-outline';
          } else if (route.name === 'Stats') {
            iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = isFocused ? 'person' : 'person-outline';
          }
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabButton}
            >
              <Ionicons 
                name={iconName} 
                size={24} 
                color={isFocused ? COLORS.navy : COLORS.gray} 
              />
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? COLORS.navy : COLORS.gray }
              ]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainApp() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleEventAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Events">
          {() => <EventsScreen refreshKey={refreshKey} />}
        </Tab.Screen>
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <AddEventButton onEventAdded={handleEventAdded} />
    </View>
  );
}

const SPLASH_SEEN_KEY = 'frontrow_splash_seen';

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Audiowide_400Regular,
    Limelight_400Regular,
    Modak_400Regular,
    Iceland_400Regular,
    Zain_400Regular,
    VT323_400Regular,
    GeistMono_400Regular: require('@expo-google-fonts/geist-mono/400Regular/GeistMono_400Regular.ttf'),
    GeistMono_500Medium: require('@expo-google-fonts/geist-mono/500Medium/GeistMono_500Medium.ttf'),
    GeistMono_700Bold: require('@expo-google-fonts/geist-mono/700Bold/GeistMono_700Bold.ttf'),
  });

  const [showSplash, setShowSplash] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SPLASH_SEEN_KEY).then(value => {
      setShowSplash(value !== 'true');
    });
  }, []);

  const handleSplashComplete = async () => {
    await AsyncStorage.setItem(SPLASH_SEEN_KEY, 'true');
    setShowSplash(false);
  };

  if (!fontsLoaded || showSplash === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.cream }}>
        <ActivityIndicator size="large" color={COLORS.navy} />
      </View>
    );
  }

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <SplashScreen onComplete={handleSplashComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <MainApp />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 88,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabBarContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 30,
    height: 60,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    marginTop: 2,
  },
});
