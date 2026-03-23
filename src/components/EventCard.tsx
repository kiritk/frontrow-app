import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, useWindowDimensions,
  ImageBackground, Image, Modal, FlatList, Dimensions, TextInput, Platform,
  KeyboardAvoidingView, TouchableWithoutFeedback
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { updateLocalEvent } from '../lib/localStorage';
import { COLORS, FONTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import { getTeamByName } from '../data/nflTeams';
import { getMLBTeamByName } from '../data/mlbTeams';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  accent: '#FFD700', accentLight: '#FFECB3',
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
  const { width } = useWindowDimensions();
  const { isGuest } = useAuth();
  const CARD_WIDTH = (width - 48 - 12) / 2;
  const CARD_HEIGHT = CARD_WIDTH * 1.2;
  const PERFORATION_TOP = CARD_HEIGHT * 0.2;

  const [showActionModal, setShowActionModal] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [showEditModal, setShowEditModal] = useState<'title' | 'date' | 'location' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [photos, setPhotos] = useState<string[]>(event.photos || []);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [venue, setVenue] = useState(event.venue);

  const photoCount = photos.length;

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowActionModal(true);
  };

  const updateEvent = async (updates: Record<string, any>) => {
    try {
      if (isGuest) {
        await updateLocalEvent(event.id, updates);
      } else {
        await supabase.from('events').update(updates).eq('id', event.id);
      }
      onUpdate?.();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const openEditModal = (field: 'title' | 'date' | 'location') => {
    setShowActionModal(false);
    if (field === 'title') setEditValue(title);
    else if (field === 'date') setEditValue(date);
    else setEditValue(venue);
    setShowEditModal(field);
  };

  const saveEdit = async () => {
    if (!editValue.trim()) return;
    if (showEditModal === 'title') {
      setTitle(editValue.trim());
      await updateEvent({ title: editValue.trim() });
    } else if (showEditModal === 'date') {
      setDate(editValue.trim());
      await updateEvent({ date: editValue.trim() });
    } else if (showEditModal === 'location') {
      setVenue(editValue.trim());
      await updateEvent({ venue: editValue.trim() });
    }
    setShowEditModal(null);
  };

  const removePhotos = async () => {
    Alert.alert('Remove Photos', 'Remove all photos from this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setPhotos([]);
          await updateEvent({ photos: [] });
          setShowActionModal(false);
        },
      },
    ]);
  };

  const pickImages = async () => {
    setShowActionModal(false);
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
        if (event.sport === 'nfl') return { gradientColors: ['#2a1a3a', '#4a2a5a', '#6a3a7a'] as [string, string, string], accentColor: '#c9a0dc' };
        if (event.sport === 'mlb') return { gradientColors: ['#1a3a1a', '#2a5a2a', '#3a7a3a'] as [string, string, string], accentColor: '#90EE90' };
        if (event.sport === 'nba') return { gradientColors: ['#8b1538', '#a01d42', '#c0294f'] as [string, string, string], accentColor: '#ff4d6d' };
        if (event.sport === 'soccer') return { gradientColors: ['#1a5f3c', '#228b4c', '#2ecc71'] as [string, string, string], accentColor: '#5ddb8d' };
        if (event.sport === 'tennis') return { gradientColors: ['#3d5c00', '#4e7a00', '#6b9a00'] as [string, string, string], accentColor: '#a0c300' };
        return { gradientColors: ['#1e3a5f', '#2d4a6f', '#3498db'] as [string, string, string], accentColor: '#5dade2' };
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

  const getConcertBackground = () => photos?.length > 0 ? { uri: photos[0] } : require('../../assets/images/concert_bg.png');
  const getTheaterBackground = () => photos?.length > 0 ? { uri: photos[0] } : require('../../assets/images/theater_bg.jpg');
  const getComedyBackground = () => photos?.length > 0 ? { uri: photos[0] } : require('../../assets/images/comedy_bg.jpg');
  const getLandmarkBackground = () => photos?.length > 0 ? { uri: photos[0] } : require('../../assets/images/landmark_bg.jpg');
  const getOtherBackground = () => photos?.length > 0 ? { uri: photos[0] } : require('../../assets/images/other_bg.jpg');

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

  const renderActionModal = () => (
    <Modal visible={showActionModal} transparent animationType="fade" onRequestClose={() => setShowActionModal(false)}>
      <TouchableWithoutFeedback onPress={() => setShowActionModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.actionModalContent}>
              {/* Close button */}
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.navy} />
              </TouchableOpacity>

              <Text style={styles.actionModalTitle}>{title}</Text>

              <View style={styles.actionModalOptions}>
                <TouchableOpacity style={styles.actionOption} onPress={() => openEditModal('title')}>
                  <Ionicons name="pencil-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.actionOptionText}>Edit Event Title</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionOption} onPress={() => openEditModal('date')}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.actionOptionText}>Edit Event Date</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionOption} onPress={() => openEditModal('location')}>
                  <Ionicons name="location-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.actionOptionText}>Edit Event Location</Text>
                </TouchableOpacity>

                <View style={styles.actionDivider} />

                <TouchableOpacity style={styles.actionOption} onPress={pickImages}>
                  <Ionicons name="cloud-upload-outline" size={20} color={COLORS.navy} />
                  <Text style={styles.actionOptionText}>Upload Photos</Text>
                </TouchableOpacity>

                {photoCount > 0 && (
                  <TouchableOpacity style={styles.actionOption} onPress={() => { setShowActionModal(false); setShowPhotoViewer(true); }}>
                    <Ionicons name="images-outline" size={20} color={COLORS.navy} />
                    <Text style={styles.actionOptionText}>View Uploaded Photos</Text>
                  </TouchableOpacity>
                )}

                {photoCount > 0 && (
                  <TouchableOpacity style={styles.actionOption} onPress={removePhotos}>
                    <Ionicons name="trash-outline" size={20} color="#E53935" />
                    <Text style={[styles.actionOptionText, { color: '#E53935' }]}>Remove Uploaded Photos</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.actionDivider} />

                <TouchableOpacity style={styles.actionOption} onPress={confirmDelete}>
                  <Ionicons name="close-circle-outline" size={20} color="#E53935" />
                  <Text style={[styles.actionOptionText, { color: '#E53935' }]}>Delete Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderEditModal = () => {
    const fieldLabel = showEditModal === 'title' ? 'Title' : showEditModal === 'date' ? 'Date' : 'Location';
    return (
      <Modal visible={showEditModal !== null} transparent animationType="fade" onRequestClose={() => setShowEditModal(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowEditModal(null)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.editModalContent}>
                  <Text style={styles.editModalTitle}>Edit {fieldLabel}</Text>
                  <TextInput
                    style={styles.editModalInput}
                    value={editValue}
                    onChangeText={setEditValue}
                    autoFocus
                    placeholder={`Enter ${fieldLabel.toLowerCase()}`}
                    placeholderTextColor={COLORS.gray}
                    returnKeyType="done"
                    onSubmitEditing={saveEdit}
                  />
                  <View style={styles.editModalButtons}>
                    <TouchableOpacity style={styles.editModalCancelButton} onPress={() => setShowEditModal(null)}>
                      <Text style={styles.editModalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editModalSaveButton} onPress={saveEdit}>
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
  };

  const renderTeamSportCard = () => {
    const homeColor = homeTeam?.primaryColor || '#2a1a3a';
    return (
      <View style={[styles.card, { height: CARD_HEIGHT }]}>
        <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
        <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />
        <View style={[styles.teamBottomColor, { backgroundColor: homeColor }]} />
        <View style={styles.teamStadiumSection}>
          <ImageBackground source={homeTeam?.stadiumImage} style={styles.teamStadiumImage} imageStyle={styles.teamStadiumImageStyle}>
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0)', homeColor + '40', homeColor + '80', homeColor + 'CC', homeColor]} locations={[0, 0.3, 0.5, 0.7, 0.85, 1]} style={styles.teamStadiumOverlay} />
          </ImageBackground>
        </View>
        <View style={styles.teamContentOverlay}>
          <View style={styles.teamLogosContainer}>
            {homeTeam && <Image source={homeTeam.logo} style={styles.teamLogo} />}
            <Text style={styles.teamVsText}>vs</Text>
            {awayTeam && <Image source={awayTeam.logo} style={styles.teamLogo} />}
          </View>
          <View style={styles.teamInfoSection}>
            <View style={styles.teamDatePill}>
              <Text style={styles.teamDateMonth}>{month} {day}</Text>
              <Text style={styles.teamDateYear}>{year}</Text>
            </View>
            <View style={styles.teamVenueSection}>
              <Ionicons name="location-outline" size={12} color="#FFFFFF" />
              <Text style={styles.teamVenueText} numberOfLines={2}>{venue}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderConcertCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />
      <View style={styles.topSection}>
        <ImageBackground source={getConcertBackground()} style={styles.imageBackground} imageStyle={styles.imageStyle}>
          <LinearGradient colors={['transparent', 'rgba(26, 26, 46, 0.7)', CONCERT_COLORS.gradientStart]} style={styles.imageOverlay} />
        </ImageBackground>
      </View>
      <View style={styles.bottomSection}>
        <Text style={styles.concertTitle} numberOfLines={2}>{title.toUpperCase()}</Text>
        <View style={styles.infoRow}>
          <View style={styles.concertDatePill}>
            <Text style={styles.concertDatePillMonth}>{month} {day}</Text>
            <Text style={styles.concertDatePillYear}>{year}</Text>
          </View>
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={CONCERT_COLORS.accentLight} />
            <Text style={styles.concertVenueText} numberOfLines={2}>{venue}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTheaterCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />
      <View style={styles.topSection}>
        <ImageBackground source={getTheaterBackground()} style={styles.imageBackground} imageStyle={styles.imageStyle}>
          <LinearGradient colors={['transparent', 'rgba(26, 10, 10, 0.7)', THEATER_COLORS.gradientStart]} style={styles.imageOverlay} />
        </ImageBackground>
      </View>
      <View style={[styles.bottomSection, { backgroundColor: THEATER_COLORS.gradientStart }]}>
        <Text style={styles.theaterTitle} numberOfLines={2}>{title.toUpperCase()}</Text>
        <View style={styles.infoRow}>
          <View style={styles.theaterDatePill}>
            <Text style={styles.theaterDatePillMonth}>{month} {day}</Text>
            <Text style={styles.theaterDatePillYear}>{year}</Text>
          </View>
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={THEATER_COLORS.accentLight} />
            <Text style={styles.theaterVenueText} numberOfLines={2}>{venue}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderComedyCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />
      <View style={styles.topSection}>
        <ImageBackground source={getComedyBackground()} style={styles.imageBackground} imageStyle={styles.imageStyle}>
          <LinearGradient colors={['transparent', 'rgba(26, 5, 5, 0.7)', COMEDY_COLORS.gradientStart]} style={styles.imageOverlay} />
        </ImageBackground>
      </View>
      <View style={[styles.bottomSection, { backgroundColor: COMEDY_COLORS.gradientStart }]}>
        <Text style={styles.comedyTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.infoRow}>
          <View style={styles.comedyDatePill}>
            <Text style={styles.comedyDatePillMonth}>{month} {day}</Text>
            <Text style={styles.comedyDatePillYear}>{year}</Text>
          </View>
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={COMEDY_COLORS.accentLight} />
            <Text style={styles.comedyVenueText} numberOfLines={2}>{venue}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderLandmarkCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />
      <View style={styles.topSection}>
        <ImageBackground source={getLandmarkBackground()} style={styles.imageBackground} imageStyle={styles.imageStyle}>
          <LinearGradient colors={['transparent', 'rgba(26, 25, 23, 0.7)', LANDMARK_COLORS.gradientStart]} style={styles.imageOverlay} />
        </ImageBackground>
      </View>
      <View style={[styles.bottomSection, { backgroundColor: LANDMARK_COLORS.gradientStart }]}>
        <Text style={styles.landmarkTitle} numberOfLines={2}>{title.toUpperCase()}</Text>
        <View style={styles.infoRow}>
          <View style={styles.landmarkDatePill}>
            <Text style={styles.landmarkDatePillMonth}>{month} {day}</Text>
            <Text style={styles.landmarkDatePillYear}>{year}</Text>
          </View>
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={LANDMARK_COLORS.accentLight} />
            <Text style={styles.landmarkVenueText} numberOfLines={2}>{venue}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderOtherCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />
      <View style={styles.topSection}>
        <ImageBackground source={getOtherBackground()} style={styles.imageBackground} imageStyle={styles.imageStyle}>
          <LinearGradient colors={['transparent', 'rgba(42, 21, 16, 0.7)', OTHER_COLORS.gradientStart]} style={styles.imageOverlay} />
        </ImageBackground>
      </View>
      <View style={[styles.bottomSection, { backgroundColor: OTHER_COLORS.gradientStart }]}>
        <Text style={styles.otherTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.infoRow}>
          <View style={styles.otherDatePill}>
            <Text style={styles.otherDatePillMonth}>{month} {day}</Text>
            <Text style={styles.otherDatePillYear}>{year}</Text>
          </View>
          <View style={styles.venueSection}>
            <Ionicons name="location-outline" size={12} color={OTHER_COLORS.accentLight} />
            <Text style={styles.otherVenueText} numberOfLines={2}>{venue}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderDefaultCard = () => (
    <View style={[styles.card, { height: CARD_HEIGHT }]}>
      <View style={[styles.perforationLeft, { top: PERFORATION_TOP }]} />
      <View style={[styles.perforationRight, { top: PERFORATION_TOP }]} />
      <LinearGradient colors={cardStyle.gradientColors} style={styles.defaultGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.defaultImageArea}>
          {photos?.length > 0 ? (
            <ImageBackground source={{ uri: photos[0] }} style={styles.defaultImageBg} imageStyle={{ borderRadius: 8 }}>
              <LinearGradient colors={['transparent', cardStyle.gradientColors[0] + 'CC']} style={StyleSheet.absoluteFill} />
            </ImageBackground>
          ) : (
            <Text style={styles.defaultTitle} numberOfLines={2}>{title.toUpperCase()}</Text>
          )}
        </View>
        {photos?.length > 0 && <Text style={styles.defaultTitleWithPhoto} numberOfLines={2}>{title.toUpperCase()}</Text>}
        <View style={styles.defaultInfoSection}>
          <View style={[styles.defaultDateBadge, { backgroundColor: cardStyle.accentColor + '20', borderColor: cardStyle.accentColor }]}>
            <Text style={[styles.defaultDateText, { color: cardStyle.accentColor }]}>{month} {day}</Text>
            <Text style={[styles.defaultYearText, { color: cardStyle.accentColor + 'CC' }]}>{year}</Text>
          </View>
          <View style={styles.defaultVenueContainer}>
            <Ionicons name="location-outline" size={10} color="#fff" />
            <Text style={styles.defaultVenueText} numberOfLines={2}>{venue}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderFrontCard = () => {
    if (event.type === 'concert') return renderConcertCard();
    if (event.type === 'theater') return renderTheaterCard();
    if (event.type === 'comedy') return renderComedyCard();
    if (event.type === 'landmark') return renderLandmarkCard();
    if (event.type === 'other') return renderOtherCard();
    if (isTeamSport && homeTeam && awayTeam) return renderTeamSportCard();
    return renderDefaultCard();
  };

  return (
    <View style={[styles.cardWrapper, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
      <TouchableOpacity onPress={handleCardPress} activeOpacity={0.95} style={{ flex: 1 }}>
        {renderFrontCard()}
      </TouchableOpacity>

      {renderActionModal()}
      {renderEditModal()}
      {renderPhotoViewer()}
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: SCREEN_WIDTH - 64,
    maxWidth: 340,
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
  actionModalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
    marginBottom: SPACING.lg,
    paddingRight: 36,
  },
  actionModalOptions: {
    gap: 4,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  actionOptionText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  actionDivider: {
    height: 1,
    backgroundColor: COLORS.cream,
    marginVertical: 4,
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
    marginBottom: SPACING.lg,
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
  },
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1a1a2e',
  },
  perforationLeft: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    zIndex: 10,
    shadowColor: '#A89880',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
  },
  perforationRight: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
    zIndex: 10,
    shadowColor: '#A89880',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 4,
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
  teamBottomColor: { ...StyleSheet.absoluteFillObject },
  teamStadiumSection: { position: 'absolute', top: 0, left: 0, right: 0, height: '70%' },
  teamStadiumImage: { flex: 1 },
  teamStadiumImageStyle: { resizeMode: 'cover' },
  teamStadiumOverlay: { ...StyleSheet.absoluteFillObject },
  teamContentOverlay: { ...StyleSheet.absoluteFillObject, padding: 12, justifyContent: 'space-between' },
  teamLogosContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  teamLogo: { width: 55, height: 55, resizeMode: 'contain' },
  teamVsText: { fontFamily: FONTS.semiBold, fontSize: 14, color: '#FFFFFF', marginHorizontal: 4 },
  teamInfoSection: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  teamDatePill: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  teamDateMonth: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 0.5, color: '#1a1a2e' },
  teamDateYear: { fontFamily: FONTS.regular, fontSize: 10, color: '#666666' },
  teamVenueSection: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', marginLeft: 8, gap: 3 },
  teamVenueText: { fontFamily: FONTS.medium, fontSize: 11, color: '#FFFFFF', textAlign: 'right', flexShrink: 1 },
  topSection: { height: '42%', overflow: 'hidden' },
  imageBackground: { flex: 1 },
  imageStyle: { resizeMode: 'cover' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  bottomSection: { flex: 1, backgroundColor: CONCERT_COLORS.gradientStart, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8, justifyContent: 'space-between' },
  concertTitle: { fontFamily: FONTS.audiowide, fontSize: 22.5, color: '#FFFFFF', textAlign: 'center', letterSpacing: 1.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  concertDatePill: { borderWidth: 1, borderColor: CONCERT_COLORS.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  concertDatePillMonth: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 0.5, color: CONCERT_COLORS.accentLight },
  concertDatePillYear: { fontFamily: FONTS.regular, fontSize: 10, color: CONCERT_COLORS.accent },
  concertVenueText: { fontFamily: FONTS.medium, fontSize: 11, textAlign: 'right', flexShrink: 1, color: CONCERT_COLORS.accentLight },
  theaterTitle: { fontFamily: FONTS.limelight, fontSize: 22.5, color: THEATER_COLORS.accent, textAlign: 'center', letterSpacing: 1 },
  theaterDatePill: { borderWidth: 1, borderColor: THEATER_COLORS.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  theaterDatePillMonth: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 0.5, color: THEATER_COLORS.accentLight },
  theaterDatePillYear: { fontFamily: FONTS.regular, fontSize: 10, color: THEATER_COLORS.accent },
  theaterVenueText: { fontFamily: FONTS.medium, fontSize: 11, textAlign: 'right', flexShrink: 1, color: THEATER_COLORS.accentLight },
  comedyTitle: { fontFamily: FONTS.modak, fontSize: 24, color: COMEDY_COLORS.accent, textAlign: 'center', letterSpacing: 0.5 },
  comedyDatePill: { borderWidth: 1, borderColor: COMEDY_COLORS.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  comedyDatePillMonth: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 0.5, color: COMEDY_COLORS.accentLight },
  comedyDatePillYear: { fontFamily: FONTS.regular, fontSize: 10, color: COMEDY_COLORS.accent },
  comedyVenueText: { fontFamily: FONTS.medium, fontSize: 11, textAlign: 'right', flexShrink: 1, color: COMEDY_COLORS.accentLight },
  landmarkTitle: { fontFamily: FONTS.iceland, fontSize: 24, color: LANDMARK_COLORS.accent, textAlign: 'center', letterSpacing: 1.5 },
  landmarkDatePill: { borderWidth: 1, borderColor: LANDMARK_COLORS.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  landmarkDatePillMonth: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 0.5, color: LANDMARK_COLORS.accentLight },
  landmarkDatePillYear: { fontFamily: FONTS.regular, fontSize: 10, color: LANDMARK_COLORS.accent },
  landmarkVenueText: { fontFamily: FONTS.medium, fontSize: 11, textAlign: 'right', flexShrink: 1, color: LANDMARK_COLORS.accentLight },
  otherTitle: { fontFamily: FONTS.zain, fontSize: 20, color: OTHER_COLORS.accent, textAlign: 'center', letterSpacing: 0.5 },
  otherDatePill: { borderWidth: 1, borderColor: OTHER_COLORS.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  otherDatePillMonth: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 0.5, color: OTHER_COLORS.accentLight },
  otherDatePillYear: { fontFamily: FONTS.regular, fontSize: 10, color: OTHER_COLORS.accent },
  otherVenueText: { fontFamily: FONTS.medium, fontSize: 11, textAlign: 'right', flexShrink: 1, color: OTHER_COLORS.accentLight },
  venueSection: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', marginLeft: 8, gap: 3 },
  defaultGradient: { flex: 1, padding: 12, justifyContent: 'space-between' },
  defaultImageArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  defaultImageBg: { width: '100%', height: '100%', justifyContent: 'flex-end' },
  defaultTitle: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF', textAlign: 'center', letterSpacing: 0.5 },
  defaultTitleWithPhoto: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF', textAlign: 'center', letterSpacing: 0.5, marginTop: 8 },
  defaultInfoSection: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 },
  defaultDateBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  defaultDateText: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 0.5 },
  defaultYearText: { fontFamily: FONTS.regular, fontSize: 10 },
  defaultVenueContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', marginLeft: 8, gap: 3 },
  defaultVenueText: { fontFamily: FONTS.medium, fontSize: 11, color: '#FFFFFF', textAlign: 'right', flexShrink: 1 },
});
