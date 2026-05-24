import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
          colors={['rgba(251,252,252,0)', 'rgba(251,252,252,1)']}
          locations={[0, 1]}
          style={styles.imageGradient}
        />
      </ImageBackground>

      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Front Row</Text>
          <Text style={styles.description}>
            Track your favorite live events, experiences, and memories all in one app.
          </Text>
        </View>

        <View style={styles.bottomContent}>
          <TouchableOpacity style={styles.ctaButton} onPress={onComplete} activeOpacity={0.9}>
            <Text style={styles.ctaText}>Start your journey</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFCFC',
  },
  background: {
    height: '55%',
    width: '100%',
    justifyContent: 'flex-end',
  },
  imageGradient: {
    height: '70%',
    width: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 80,
    justifyContent: 'space-between',
  },
  textBlock: {
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: FONTS.instrumentSerifItalic,
    fontSize: 64,
    color: COLORS.navy,
    lineHeight: 70,
    letterSpacing: -1,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.black,
    lineHeight: 26,
    marginTop: 16,
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
