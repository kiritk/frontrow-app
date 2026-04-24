import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ImageBackground, Image, Modal, FlatList, Dimensions, TextInput, Platform,
  KeyboardAvoidingView, TouchableWithoutFeedback, ScrollView, Keyboard, Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import CalendarPicker from './CalendarPicker';

import { useAuth } from '../context/AuthContext';
import { editEvent } from '../lib/eventService';
import { SORTED_CITIES, USCity } from '../data/usCities';
import { COLORS, FONTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const STACKED_CARD_HEIGHT = 230;
export const PEEK_HEIGHT = 52;

interface EventCardProps {
  event: {
    id: string;
    title: string;
    type: string;
    sport?: string;
    venue: string;
    venue_location?: string;
    date: string;
    photos?: string[];
    cover_photo?: string;
    home_team?: { name: string; city: string; fullName: string };
    away_team?: { name: string; city: string; fullName: string };
  };
  onDelete: () => void;
  onUpdate?: () => void;
}

const CONCERT_COLORS = {
  gradientStart: '#1a1a2e', gradientMid: '#2d1f3d', gradientEnd: '#4a1a6b',
  accent: '#9b6dff', accentLight: '#c4a7ff',
};
const THEATER_COLORS = {
  gradientStart: '#1a0a0a', gradientMid: '#3d1a1a', gradientEnd: '#6b1a2e',
  accent: '#003CFF', accentLight: '#FFECB3',
};
const COMEDY_COLORS = {
  gradientStart: '#1a0505', gradientMid: '#3d0a0a', gradientEnd: '#6b0101',
  accent: '#FF6B6B', accentLight: '#FFB3B3',
};
const LANDMARK_COLORS = {
  gradientStart: '#1a1917', gradientMid: '#2d2b28', gradientEnd: '#3b3734',
  accent: '#D4A574', accentLight: '#E8D4C4',
};
const OTHER_COLORS = {
  gradientStart: '#2a1510', gradientMid: '#4d2a1f', gradientEnd: '#e6563b',
  accent: '#FFB899', accentLight: '#FFE0D4',
};

export default function EventCard({ event, onDelete, onUpdate }: EventCardProps) {
  const { user, isGuest } = useAuth();

  const [showActionModal, setShowActionModal] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [showEditModal, setShowEditModal] = useState<'title' | 'date' | 'location' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [photos, setPhotos] = useState<string[]>(event.photos || []);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [venue, setVenue] = useState(event.venue);

  // Date picker state
  const [editDate, setEditDate] = useState(new Date());

  // Location search state
  const [cityQuery, setCityQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const photoCount = photos.length;

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowActionModal(true);
  };

  const updateEvent = async (updates: Record<string, any>) => {
    try {
      await editEvent(event.id, updates, user?.id);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const openEditModal = (field: 'title' | 'date' | 'location') => {
    setShowActionModal(false);
    if (field === 'title') {
      setEditValue(title);
    } else if (field === 'date') {
      setEditDate(new Date(date));
    } else {
      setCityQuery(venue);
      setShowCityDropdown(false);
    }
    // Small delay to let the action modal fully dismiss before opening edit modal
    setTimeout(() => setShowEditModal(field), 300);
  };

  const closeEditModal = () => {
    setShowEditModal(null);
    setTimeout(() => setShowActionModal(true), 300);
  };

  const saveTitle = async () => {
    if (!editValue.trim()) return;
    setTitle(editValue.trim());
    await updateEvent({ title: editValue.trim() });
    closeEditModal();
  };

  const saveDate = async (selectedDate: Date) => {
    const isoDate = selectedDate.toISOString();
    setEditDate(selectedDate);
    setDate(isoDate);
    await updateEvent({ date: isoDate });
  };

  const confirmDateEdit = () => {
    closeEditModal();
  };

  const getFilteredCities = (query: string) => {
    if (!query) return SORTED_CITIES.slice(0, 5);
    return SORTED_CITIES.filter(city =>
      city.displayName.toLowerCase().includes(query.toLowerCase()) ||
      city.city.toLowerCase().includes(query.toLowerCase()) ||
      city.state.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const selectCity = async (city: USCity) => {
    setVenue(city.displayName);
    setCityQuery(city.displayName);
    setShowCityDropdown(false);
    await updateEvent({ venue: city.displayName });
    Keyboard.dismiss();
    closeEditModal();
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const remainingSlots = 6 - photoCount;
    if (remainingSlots <= 0) {
      Alert.alert('Limit reached', 'Maximum 6 photos per event');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newPhotos = [...photos, ...result.assets.map(a => a.uri)].slice(0, 6);
      setPhotos(newPhotos);
      await updateEvent({ photos: newPhotos });
    }
  };

  const confirmDelete = () => {
    setShowActionModal(false);
    Alert.alert('Delete Event', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  };

  const getCardStyle = () => {
    switch (event.type) {
      case 'concert': return { gradientColors: [CONCERT_COLORS.gradientStart, CONCERT_COLORS.gradientMid, CONCERT_COLORS.gradientEnd] as [string, string, string], accentColor: CONCERT_COLORS.accent };
      case 'theater': return { gradientColors: [THEATER_COLORS.gradientStart, THEATER_COLORS.gradientMid, THEATER_COLORS.gradientEnd] as [string, string, string], accentColor: THEATER_COLORS.accent };
      case 'comedy': return { gradientColors: [COMEDY_COLORS.gradientStart, COMEDY_COLORS.gradientMid, COMEDY_COLORS.gradientEnd] as [string, string, string], accentColor: COMEDY_COLORS.accent };
      case 'landmark': return { gradientColors: [LANDMARK_COLORS.gradientStart, LANDMARK_COLORS.gradientMid, LANDMARK_COLORS.gradientEnd] as [string, string, string], accentColor: LANDMARK_COLORS.accent };
      case 'other': return { gradientColors: [OTHER_COLORS.gradientStart, OTHER_COLORS.gradientMid, OTHER_COLORS.gradientEnd] as [string, string, string], accentColor: OTHER_COLORS.accent };
      case 'sports':
        if (event.sport === 'nfl') return { gradientColors: ['#2a1a3a', '#4a2a5a', '#6a3a7a'] as [string, string, string], accentColor: '#BA4813' };
        if (event.sport === 'mlb') return { gradientColors: ['#1a3a1a', '#2a5a2a', '#3a7a3a'] as [string, string, string], accentColor: '#D90000' };
        if (event.sport === 'nba') return { gradientColors: ['#7a3000', '#c04e1a', '#f0622d'] as [string, string, string], accentColor: '#FF6B24' };
        if (event.sport === 'soccer') return { gradientColors: ['#003d5c', '#005a8a', '#0077B6'] as [string, string, string], accentColor: '#66b8de' };
        if (event.sport === 'tennis') return { gradientColors: ['#3d5c00', '#4e7a00', '#6b9a00'] as [string, string, string], accentColor: '#a0c300' };
        return { gradientColors: ['#5c0008', '#900010', '#c30010'] as [string, string, string], accentColor: '#003FFF' };
      default: return { gradientColors: ['#2c3e50', '#3a4f63', '#4a6278'] as [string, string, string], accentColor: '#85929e' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    return { month, day, year };
  };

  const { month, day, year } = formatDate(date);
  const cardStyle = getCardStyle();

  const isNFLGame = event.sport === 'nfl' && event.home_team && event.away_team;
  const isMLBGame = event.sport === 'mlb' && event.home_team && event.away_team;
  const isTeamSport = isNFLGame || isMLBGame;

  const homeTeam = isNFLGame ? getTeamByName(event.home_team!.name) : isMLBGame ? getMLBTeamByName(event.home_team!.name) : null;
  const awayTeam = isNFLGame ? getTeamByName(event.away_team!.name) : isMLBGame ? getMLBTeamByName(event.away_team!.name) : null;

  const getBackgroundSource = () => {
    if (event.cover_photo) return { uri: event.cover_photo };
    switch (event.type) {
      case 'concert': return require('../../assets/images/concert_bg.png');
      case 'theater': return require('../../assets/images/theater_bg.jpg');
      case 'comedy': return require('../../assets/images/comedy_bg.jpg');
      case 'landmark': return require('../../assets/images/landmark_bg.jpg');
      case 'other': return require('../../assets/images/other_bg.jpg');
      case 'sports':
        if (isTeamSport && homeTeam?.stadiumImage) return homeTeam.stadiumImage;
        if (event.sport === 'nba') return require('../../assets/images/basketball_bg.jpg');
        if (event.sport === 'soccer') return require('../../assets/images/soccer_bg.jpg');
        if (event.sport === 'tennis') return require('../../assets/images/tennis_bg.jpg');
        return require('../../assets/images/other_sports_bg.jpg');
      default: return null;
    }
  };

  const renderPhotoViewer = () => (
    <Modal visible={showPhotoViewer} transparent animationType="fade" onRequestClose={() => setShowPhotoViewer(false)}>
      <View style={styles.photoViewerOverlay}>
        <TouchableOpacity style={styles.photoViewerClose} onPress={() => setShowPhotoViewer(false)}>
          <Ionicons name="close" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.photoViewerSlide}>
              <Image source={{ uri: item }} style={styles.photoViewerImage} resizeMode="contain" />
            </View>
          )}
        />
        <View style={styles.photoViewerIndicator}>
          <Text style={styles.photoViewerIndicatorText}>{photos.length} photo{photos.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>
    </Modal>
  );

  const removePhoto = async (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    await updateEvent({ photos: newPhotos });
  };

  const PHOTO_GRID_SIZE = (SCREEN_WIDTH - 40 - SPACING.xl * 2 - 10 * 2) / 3;

  const renderActionModal = () => {
    const displayDate = formatDate(date);
    return (
      <Modal visible={showActionModal} transparent animationType="fade" onRequestClose={() => setShowActionModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowActionModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.detailModalContent}>
                {/* Close button */}
                <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowActionModal(false)}>
                  <Ionicons name="close" size={22} color={COLORS.navy} />
                </TouchableOpacity>

                {/* Tappable Title */}
                <TouchableOpacity onPress={() => openEditModal('title')} style={styles.detailFieldRow}>
                  <Text style={styles.detailTitle} numberOfLines={2}>{title}</Text>
                  <Ionicons name="pencil-outline" size={16} color={COLORS.gray} />
                </TouchableOpacity>

                {/* Date & Location row */}
                <View style={styles.detailMetaRow}>
                  <TouchableOpacity onPress={() => openEditModal('date')} style={styles.detailMetaField}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.navy} />
                    <Text style={styles.detailMetaText}>{displayDate.month} {displayDate.day}, {displayDate.year}</Text>
                    <Ionicons name="pencil-outline" size={12} color={COLORS.gray} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openEditModal('location')} style={[styles.detailMetaField, { flex: 1 }]}>
                    <Ionicons name="location-outline" size={16} color={COLORS.navy} />
                    <Text style={styles.detailMetaText} numberOfLines={1}>{venue}</Text>
                    <Ionicons name="pencil-outline" size={12} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>

                {/* Photo Grid */}
                <View style={styles.detailPhotoGrid}>
                  {photos.map((photo, index) => (
                    <View key={index} style={[styles.detailPhotoWrapper, { width: PHOTO_GRID_SIZE, height: PHOTO_GRID_SIZE }]}>
                      <TouchableOpacity
                        onPress={() => { setShowActionModal(false); setShowPhotoViewer(true); }}
                        activeOpacity={0.85}
                      >
                        <Image source={{ uri: photo }} style={[styles.detailPhoto, { width: PHOTO_GRID_SIZE, height: PHOTO_GRID_SIZE }]} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.detailPhotoRemove} onPress={() => removePhoto(index)}>
                        <Ionicons name="close-circle" size={20} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {photoCount < 6 && (
                    <TouchableOpacity
                      style={[styles.detailAddPhotoButton, { width: PHOTO_GRID_SIZE, height: PHOTO_GRID_SIZE }]}
                      onPress={pickImages}
                    >
                      <Ionicons name="add" size={28} color={COLORS.gray} />
                      <Text style={styles.detailAddPhotoText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Delete button */}
                <TouchableOpacity style={styles.detailDeleteButton} onPress={confirmDelete}>
                  <Ionicons name="trash-outline" size={18} color="#E53935" />
                  <Text style={styles.detailDeleteText}>Delete Event</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderEditTitleModal = () => (
    <Modal visible={showEditModal === 'title'} transparent animationType="fade" onRequestClose={closeEditModal}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={closeEditModal}>
          <View style={styles.editModalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.editModalContent}>
                <Text style={styles.editModalTitle}>Edit Title</Text>
                <TextInput
                  style={[styles.editModalInput, { marginBottom: SPACING.lg }]}
                  value={editValue}
                  onChangeText={setEditValue}
                  autoFocus
                  placeholder="Enter title"
                  placeholderTextColor={COLORS.gray}
                  returnKeyType="done"
                  onSubmitEditing={saveTitle}
                />
                <View style={styles.editModalButtons}>
                  <TouchableOpacity style={styles.editModalCancelButton} onPress={closeEditModal}>
                    <Text style={styles.editModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editModalSaveButton} onPress={saveTitle}>
                    <Text style={styles.editModalSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderEditDateModal = () => (
    <Modal visible={showEditModal === 'date'} transparent animationType="fade" onRequestClose={closeEditModal}>
      <TouchableWithoutFeedback onPress={closeEditModal}>
        <View style={styles.editModalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.editModalContent}>
              <Text style={styles.editModalTitle}>Edit Date</Text>
              <CalendarPicker
                selectedDate={editDate}
                onDateChange={(d) => saveDate(d)}
                maximumDate={new Date(2030, 11, 31)}
                minimumDate={new Date(1950, 0, 1)}
              />
              <Pressable style={styles.editModalSaveButton} onPress={confirmDateEdit}>
                <Text style={styles.editModalSaveText}>Done</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderEditLocationModal = () => {
    const filteredCities = getFilteredCities(cityQuery);
    return (
      <Modal visible={showEditModal === 'location'} transparent animationType="fade" onRequestClose={closeEditModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={closeEditModal}>
            <View style={styles.editModalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.editModalContent}>
                  <Text style={styles.editModalTitle}>Edit Location</Text>
                  <View style={styles.editLocationInputWrapper}>
                    <TextInput
                      style={styles.editModalInput}
                      value={cityQuery}
                      onChangeText={(t) => { setCityQuery(t); setShowCityDropdown(true); }}
                      autoFocus
                      placeholder="Search cities..."
                      placeholderTextColor={COLORS.gray}
                      onFocus={() => setShowCityDropdown(true)}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (filteredCities.length > 0) selectCity(filteredCities[0]);
                      }}
                    />
                    {showCityDropdown && filteredCities.length > 0 && (
                      <View style={styles.editCityDropdown}>
                        <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled style={{ maxHeight: 200 }}>
                          {filteredCities.map((city, index) => (
                            <TouchableOpacity
                              key={`${city.city}-${city.stateCode}`}
                              style={[styles.editCityDropdownItem, index === 0 && styles.editCityDropdownItemFirst]}
                              onPress={() => selectCity(city)}
                            >
                              <Text style={styles.editCityDropdownText}>{city.displayName}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  <View style={styles.editModalButtons}>
                    <TouchableOpacity style={styles.editModalCancelButton} onPress={closeEditModal}>
                      <Text style={styles.editModalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const getTitleFont = () => {
    switch (event.type) {
      case 'concert':  return FONTS.audiowide;
      case 'theater':  return FONTS.limelight;
      case 'comedy':   return FONTS.modak;
      case 'landmark': return FONTS.iceland;
      case 'other':    return FONTS.zain;
      default:         return FONTS.bold;
    }
  };

  const getTitleText = () => {
    switch (event.type) {
      case 'concert':
      case 'theater':
      case 'landmark':
        return title.toUpperCase();
      default:
        return title;
    }
  };

  const renderFrontCard = () => {
    const bgSource = getBackgroundSource();
    const titleFont = getTitleFont();
    const displayTitle = getTitleText();

    return (
      <View style={styles.stackedCard}>
        {/* Full-bleed background — extends all the way to the top */}
        {bgSource ? (
          <ImageBackground
            source={bgSource}
            style={StyleSheet.absoluteFill}
            imageStyle={styles.stackedBgImage}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.62)', 'rgba(0,0,0,0.18)', 'rgba(0,0,0,0.68)']}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
        ) : (
          <LinearGradient
            colors={cardStyle.gradientColors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        )}

        {/* Accent gradient — 100% → 70% → 0% over 60px */}
        {(() => {
          const bandColor = (isTeamSport && homeTeam) ? homeTeam.primaryColor : cardStyle.accentColor;
          return (
            <LinearGradient
              colors={[bandColor + 'FF', bandColor + 'B3', bandColor + '00']}
              locations={[0, 0.667, 1]}
              style={styles.accentBand}
            />
          );
        })()}

        {/* Peek header — sits on top of accent band */}
        <View style={styles.peekHeader}>
          {isTeamSport && homeTeam && awayTeam ? (
            <View style={styles.peekTeamRow}>
              <Image source={homeTeam.logo} style={styles.peekTeamLogo} />
              <Text style={styles.peekVs}>vs</Text>
              <Image source={awayTeam.logo} style={styles.peekTeamLogo} />
            </View>
          ) : (
            <Text style={[styles.peekTitle, { fontFamily: titleFont }]} numberOfLines={1}>
              {displayTitle}
            </Text>
          )}
          <Text style={styles.peekDate}>{month} {day}, {year}</Text>
        </View>

        {/* Body */}
        <View style={styles.stackedBody}>
          {isTeamSport && homeTeam && awayTeam ? (
            <View style={styles.stackedTeamRow}>
              <Image source={homeTeam.logo} style={styles.stackedLogo} />
              <Text style={styles.stackedVs}>VS</Text>
              <Image source={awayTeam.logo} style={styles.stackedLogo} />
            </View>
          ) : (
            <Text style={[styles.stackedTitle, { fontFamily: titleFont }]} numberOfLines={2}>
              {displayTitle}
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.stackedFooter}>
          <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.75)" />
          <Text style={styles.stackedVenue} numberOfLines={1}>{venue}</Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.stackedCardWrapper}>
        <TouchableOpacity onPress={handleCardPress} activeOpacity={0.95} style={{ flex: 1 }}>
          {renderFrontCard()}
        </TouchableOpacity>
      </View>

      {renderActionModal()}
      {renderEditTitleModal()}
      {renderEditDateModal()}
      {renderEditLocationModal()}
      {renderPhotoViewer()}
    </>
  );
}

const styles = StyleSheet.create({
  stackedCardWrapper: {
    width: SCREEN_WIDTH * 0.9,
    height: STACKED_CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  stackedCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  stackedBgImage: {
    resizeMode: 'cover',
  },
  accentBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  peekHeader: {
    height: PEEK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,

  },
  peekTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  peekDate: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  peekTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  peekTeamLogo: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  peekVs: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  stackedTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  stackedBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stackedTeamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stackedLogo: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  stackedVs: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  stackedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    gap: 6,
  },
  stackedVenue: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: SPACING.xl,
    paddingTop: 28,
    paddingBottom: SPACING.lg,
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  detailFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingRight: 40,
    gap: 8,
  },
  detailTitle: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.navy,
    flex: 1,
  },
  detailMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  detailMetaField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.md,
    gap: 6,
  },
  detailMetaText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
    flexShrink: 1,
  },
  detailPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.xl,
  },
  detailPhotoWrapper: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  detailPhoto: {
    borderRadius: 10,
  },
  detailPhotoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailAddPhotoButton: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.cream,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  detailAddPhotoText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray,
  },
  detailDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cream,
    marginTop: SPACING.sm,
  },
  detailDeleteText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: '#E53935',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: SCREEN_WIDTH - 64,
    maxWidth: 340,
  },
  editModalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
  editModalInput: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
    borderWidth: 1,
    borderColor: COLORS.cream,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  editModalCancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cream,
  },
  editModalCancelText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
  editModalSaveButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.navy,
  },
  editModalSaveText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    textAlign: 'center',
  },
  editLocationInputWrapper: {
    position: 'relative',
    zIndex: 10,
    marginBottom: SPACING.lg,
  },
  editCityDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cream,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 4,
    overflow: 'hidden',
  },
  editCityDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cream,
  },
  editCityDropdownItemFirst: {
    borderTopWidth: 0,
  },
  editCityDropdownText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
  },
  photoViewerClose: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerSlide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoViewerImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.7,
  },
  photoViewerIndicator: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  photoViewerIndicatorText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
});
