import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ShareCardModal from './ShareCardModal';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE_PADDING = SCREEN_WIDTH * 0.05;

export default function AppHeader() {
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const [shareVisible, setShareVisible] = useState(false);
  const profileImage = profile.profileImage;

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileButtonImage} />
          ) : (
            <View style={styles.profileButtonPlaceholder}>
              <Ionicons name="person" size={18} color={COLORS.navy} />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.logoPill}>
          <Text style={styles.logoText}>Front Row</Text>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={() => setShareVisible(true)}>
          <Ionicons name="share-outline" size={18} color={COLORS.navy} />
        </TouchableOpacity>
      </View>
      {shareVisible && <ShareCardModal visible onClose={() => setShareVisible(false)} />}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIDE_PADDING,
    paddingVertical: SPACING.sm,
  },
  profileButton: {
    width: 38,
    height: 38,
  },
  profileButtonImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: COLORS.navy,
  },
  profileButtonPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.creamDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoPill: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
  },
  logoText: {
    fontFamily: FONTS.instrumentSerifItalic,
    fontSize: 25,
    color: COLORS.navy,
  },
  shareButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.creamDark,
  },
});
