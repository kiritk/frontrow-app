import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FONT_GEIST_REGULAR = 'GeistMono_400Regular';
const FONT_GEIST_BOLD = 'GeistMono_700Bold';
const FONT_GEIST_MEDIUM = 'GeistMono_500Medium';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/splash_screen_bg.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)']}
          locations={[0, 0.3, 0.7, 1]}
          style={styles.overlay}
        >
          {/* Top content */}
          <View style={styles.topContent}>
            <Text style={styles.title}>Front{'\n'}Row</Text>
            <View style={styles.subtitlePill}>
              <Text style={styles.subtitle}>Never forget that moment</Text>
            </View>
          </View>

          {/* Bottom CTA */}
          <View style={styles.bottomContent}>
            <TouchableOpacity style={styles.ctaButton} onPress={onComplete} activeOpacity={0.9}>
              <Text style={styles.ctaText}>Start your journey</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 80,
    paddingHorizontal: 28,
  },
  topContent: {
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: FONT_GEIST_BOLD,
    fontSize: 72,
    color: COLORS.white,
    lineHeight: 80,
    letterSpacing: -2,
  },
  subtitlePill: {
    backgroundColor: 'rgba(106,106,106,0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1D1D1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  subtitle: {
    fontFamily: FONT_GEIST_REGULAR,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bottomContent: {
    alignItems: 'center',
  },
  ctaButton: {
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: SCREEN_WIDTH - 80,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: FONT_GEIST_MEDIUM,
    fontSize: 17,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
});
