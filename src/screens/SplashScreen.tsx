import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme/colors';

const THUMB_SIZE = 60;
const TRACK_HEIGHT = 64;
const TRACK_PADDING = 0;
const COMPLETE_THRESHOLD = 0.85;

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const currentXRef = useRef(0);
  const startXRef = useRef(0);
  const completedRef = useRef(false);

  const maxTranslate = Math.max(0, trackWidth - THUMB_SIZE - TRACK_PADDING * 2);

  useEffect(() => {
    const id = translateX.addListener(({ value }) => {
      currentXRef.current = value;
    });
    return () => translateX.removeListener(id);
  }, [translateX]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startXRef.current = currentXRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.min(
            Math.max(0, startXRef.current + gesture.dx),
            maxTranslate,
          );
          translateX.setValue(next);
        },
        onPanResponderRelease: () => {
          if (maxTranslate > 0 && currentXRef.current >= maxTranslate * COMPLETE_THRESHOLD) {
            Animated.timing(translateX, {
              toValue: maxTranslate,
              duration: 120,
              useNativeDriver: false,
            }).start(() => {
              if (!completedRef.current) {
                completedRef.current = true;
                onComplete();
              }
            });
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: false,
              bounciness: 0,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        },
      }),
    [maxTranslate, onComplete, translateX],
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const labelOpacity = translateX.interpolate({
    inputRange: [0, Math.max(1, maxTranslate)],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const fillWidth = translateX.interpolate({
    inputRange: [0, Math.max(1, maxTranslate)],
    outputRange: [TRACK_PADDING + THUMB_SIZE, Math.max(TRACK_PADDING + THUMB_SIZE, trackWidth)],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <Image
          source={require('../../assets/images/splash_screen_bg.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(251,252,252,0)', 'rgba(251,252,252,1)']}
          locations={[0, 1]}
          style={styles.backgroundGradient}
          pointerEvents="none"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Front Row</Text>
          <Text style={styles.description}>
            Track your favorite live events, experiences, and memories all in one app.
          </Text>
        </View>

        <View style={styles.bottomContent}>
          <View style={styles.sliderTrack} onLayout={onTrackLayout}>
            <Animated.View
              style={[styles.sliderFill, { width: fillWidth }]}
              pointerEvents="none"
            />
            <Animated.Text style={[styles.sliderLabel, { opacity: labelOpacity }]}>
              Add your first event
            </Animated.Text>

            <View style={styles.chevronGroup} pointerEvents="none">
              <Ionicons name="chevron-forward" size={22} color={COLORS.black} style={styles.chevron} />
              <Ionicons name="chevron-forward" size={22} color={COLORS.black} style={styles.chevronOverlap} />
            </View>

            <Animated.View
              style={[styles.thumb, { transform: [{ translateX }] }]}
              {...panResponder.panHandlers}
            >
              <Ionicons name="ticket" size={26} color={COLORS.white} style={styles.ticketIcon} />
            </Animated.View>
          </View>
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
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '55%',
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 56,
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
    fontSize: 22,
    color: COLORS.grayDark,
    lineHeight: 30,
    marginTop: 16,
  },
  bottomContent: {
    alignItems: 'stretch',
  },
  sliderTrack: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: '#EFEFEF',
    borderWidth: 2,
    borderColor: COLORS.navy,
    justifyContent: 'center',
    paddingHorizontal: TRACK_PADDING,
    overflow: 'hidden',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#96ABBD',
  },
  sliderLabel: {
    textAlign: 'center',
    fontFamily: FONTS.regular,
    fontSize: 18,
    color: COLORS.black,
  },
  chevronGroup: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginRight: -10,
  },
  chevronOverlap: {},
  thumb: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketIcon: {
    transform: [{ rotate: '-20deg' }],
  },
});
