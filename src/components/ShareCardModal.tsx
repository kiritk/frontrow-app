import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Share, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

import { getLocalEvents } from '../lib/localStorage';
import FanCard from './FanCard';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme/colors';

const PROFILE_STORAGE_KEY = 'frontrow_user_profile';

interface ShareCardModalProps {
  visible: boolean;
  onClose: () => void;
}

function getFanLevel(eventCount: number): string {
  if (eventCount >= 50) return 'Legend';
  if (eventCount >= 25) return 'All-Star';
  if (eventCount >= 10) return 'Pro';
  return 'Rookie';
}

export default function ShareCardModal({ visible, onClose }: ShareCardModalProps) {
  const cardRef = useRef<ViewShot>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [cityCount, setCityCount] = useState(0);
  const [venueCount, setVenueCount] = useState(0);
  const [sportsCount, setSportsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [stored, events] = await Promise.all([
        AsyncStorage.getItem(PROFILE_STORAGE_KEY),
        getLocalEvents(),
      ]);
      if (stored) {
        const profile = JSON.parse(stored);
        setFirstName(profile.firstName || '');
        setLastName(profile.lastName || '');
        setProfileImage(profile.profileImage || null);
      }
      setEventCount(events.length);
      setCityCount(new Set(events.map(e => e.venue_location || e.venue).filter(Boolean)).size);
      setVenueCount(new Set(events.map(e => e.venue).filter(Boolean)).size);
      setSportsCount(events.filter(e => e.type === 'sports').length);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (visible) loadData();
  }, [visible, loadData]);

  const captureCard = async (): Promise<string | null> => {
    try {
      const uri = await (cardRef.current as any).capture();
      return uri;
    } catch {
      Alert.alert('Error', 'Could not capture card image.');
      return null;
    }
  };

  const handleMessage = async () => {
    setLoading(true);
    const uri = await captureCard();
    setLoading(false);
    if (!uri) return;
    try {
      await Share.share(
        Platform.OS === 'ios' ? { url: uri } : { message: 'Check out my Front Row Fan Card!' },
      );
    } catch (e: any) {
      if (e.message !== 'The user did not share') {
        Alert.alert('Error', 'Could not open share sheet.');
      }
    }
  };

  const handlePhotos = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your Photos library.');
      return;
    }
    setLoading(true);
    const uri = await captureCard();
    setLoading(false);
    if (!uri) return;
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Saved!', 'Your card has been saved to Photos.');
    } catch {
      Alert.alert('Error', 'Could not save to Photos.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={COLORS.navy} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Your Card</Text>
              <Text style={styles.headerSubtitle}>Share and Save</Text>
            </View>
            <View style={styles.headerButton} />
          </View>

          {/* Card */}
          <View style={styles.cardArea}>
            <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
              <FanCard
                firstName={firstName}
                lastName={lastName}
                profileImage={profileImage}
                fanLevel={getFanLevel(eventCount)}
                eventCount={eventCount}
                cityCount={cityCount}
                venueCount={venueCount}
                sportsCount={sportsCount}
              />
            </ViewShot>
          </View>
        </SafeAreaView>

        {/* Bottom CTAs */}
        <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.ctaButton} onPress={handleMessage} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <>
                  <View style={styles.ctaIconCircle}>
                    <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={styles.ctaLabel}>Message</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaButton} onPress={handlePhotos} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.navy} />
              ) : (
                <>
                  <View style={[styles.ctaIconCircle, styles.ctaIconCirclePhotos]}>
                    <Ionicons name="image" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={styles.ctaLabel}>Photos</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    justifyContent: 'space-between',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
    marginTop: 1,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  bottomSafeArea: {
    backgroundColor: '#F2F2F7',
  },
  ctaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  ctaButton: {
    alignItems: 'center',
    gap: 8,
  },
  ctaIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaIconCirclePhotos: {
    backgroundColor: '#FF9500',
  },
  ctaLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
});
