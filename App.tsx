import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Audiowide_400Regular } from '@expo-google-fonts/audiowide';
import { Limelight_400Regular } from '@expo-google-fonts/limelight';
import { Modak_400Regular } from '@expo-google-fonts/modak';
import { Iceland_400Regular } from '@expo-google-fonts/iceland';
import { Zain_400Regular } from '@expo-google-fonts/zain';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { Tourney_900Black } from '@expo-google-fonts/tourney';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider } from './src/context/AuthContext';
import EventsScreen from './src/screens/EventsScreen';
import MapScreen from './src/screens/MapScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingFlow, { OnboardingData } from './src/screens/onboarding/OnboardingFlow';
import { buildPreviewEvent } from './src/screens/onboarding/ConfirmationStep';
import { saveLocalEvent } from './src/lib/localStorage';
import AddEventButton from './src/components/AddEventButton';
import { COLORS, FONTS } from './src/theme/colors';
import { TAB_BAR_HEIGHT, TAB_BAR_BOTTOM_OFFSET } from './src/theme/layout';

const Tab = createBottomTabNavigator();

// Visible tabs in the pill bar — Profile is omitted (accessed via header icon).
const VISIBLE_TABS = ['Events', 'Map', 'Stats'];

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        {state.routes.map((route: any, index: number) => {
          if (!VISIBLE_TABS.includes(route.name)) return null;

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
          } else if (route.name === 'Map') {
            iconName = isFocused ? 'map' : 'map-outline';
          } else if (route.name === 'Stats') {
            iconName = isFocused ? 'stats-chart' : 'stats-chart-outline';
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
              <Text style={[styles.tabLabel, { color: isFocused ? COLORS.navy : COLORS.gray }]}>
                {route.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainApp({ playWelcomeConfetti = false }: { playWelcomeConfetti?: boolean }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(playWelcomeConfetti);

  useEffect(() => {
    if (!playWelcomeConfetti) return;
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, [playWelcomeConfetti]);

  const handleEventAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          // Let the screen (and the globe) render all the way to the bottom edge
          // behind the floating tab-bar pill instead of being clipped above it.
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
      >
        <Tab.Screen name="Events">
          {() => <EventsScreen refreshKey={refreshKey} />}
        </Tab.Screen>
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <AddEventButton onEventAdded={handleEventAdded} />
      {showConfetti && (
        <ConfettiCannon
          count={150}
          origin={{ x: Dimensions.get('window').width / 2, y: -20 }}
          fadeOut
          explosionSpeed={400}
          fallSpeed={2500}
          colors={[COLORS.navy, '#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']}
          autoStart
        />
      )}
    </View>
  );
}

const SPLASH_SEEN_KEY = 'frontrow_splash_seen';
const ONBOARDING_COMPLETE_KEY = 'frontrow_onboarding_complete';
const ONBOARDING_DATA_KEY = 'frontrow_onboarding_data';

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
    Tourney_900Black,
    InstrumentSerif_400Regular_Italic,
    GeistMono_400Regular: require('./assets/fonts/GeistMono_400Regular.ttf'),
    GeistMono_500Medium: require('./assets/fonts/GeistMono_500Medium.ttf'),
    GeistMono_700Bold: require('./assets/fonts/GeistMono_700Bold.ttf'),
  });

  const [showSplash, setShowSplash] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [playWelcomeConfetti, setPlayWelcomeConfetti] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SPLASH_SEEN_KEY),
      AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY),
    ]).then(([splashValue, onboardingValue]) => {
      setShowSplash(splashValue !== 'true');
      setShowOnboarding(onboardingValue !== 'true');
    });
  }, []);

  const handleSplashComplete = async () => {
    await AsyncStorage.setItem(SPLASH_SEEN_KEY, 'true');
    setShowSplash(false);
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (data.eventType) {
      const preview = buildPreviewEvent(data.eventType, data.details, data.photos);
      const { id, created_at, ...rest } = preview;
      try {
        await saveLocalEvent(rest);
      } catch (e) {
        console.warn('Failed to save onboarding event', e);
      }
    }
    await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setPlayWelcomeConfetti(true);
    setShowOnboarding(false);
  };

  if (!fontsLoaded || showSplash === null || showOnboarding === null) {
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

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <MainApp playWelcomeConfetti={playWelcomeConfetti} />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: TAB_BAR_BOTTOM_OFFSET,
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
    height: TAB_BAR_HEIGHT,
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
