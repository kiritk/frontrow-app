import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Alert, ActivityIndicator, Image,
  Dimensions, Keyboard, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import CalendarPicker from './CalendarPicker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { saveLocalEvent } from '../lib/localStorage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import { NFL_TEAMS, NFLTeam } from '../data/nflTeams';
import { MLB_TEAMS, MLBTeam } from '../data/mlbTeams';
import { SORTED_CITIES, USCity } from '../data/usCities';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const EVENT_TYPES = [
  { value: 'sports', label: 'Sports', emoji: '🏆' },
  { value: 'concert', label: 'Concerts', emoji: '🎸' },
  { value: 'theater', label: 'Theater', emoji: '🎭' },
  { value: 'comedy', label: 'Comedy', emoji: '🎤' },
  { value: 'landmark', label: 'Landmarks', emoji: '🏰' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

const SPORT_TYPES = [
  { value: 'nfl', label: 'NFL', emoji: '🏈' },
  { value: 'mlb', label: 'MLB', emoji: '⚾' },
  { value: 'nba', label: 'NBA', emoji: '🏀' },
  { value: 'soccer', label: 'Soccer', emoji: '⚽' },
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'other', label: 'Other', emoji: '🏅' },
];

type SportTeam = NFLTeam | MLBTeam;

export default function AddEventButton({ onEventAdded }: { onEventAdded: () => void }) {
  const { user, isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [eventType, setEventType] = useState('');
  const [sportType, setSportType] = useState('');
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Team state
  const [homeTeam, setHomeTeam] = useState<SportTeam | null>(null);
  const [awayTeam, setAwayTeam] = useState<SportTeam | null>(null);
  const [homeTeamQuery, setHomeTeamQuery] = useState('');
  const [awayTeamQuery, setAwayTeamQuery] = useState('');
  const [showHomeDropdown, setShowHomeDropdown] = useState(false);
  const [showAwayDropdown, setShowAwayDropdown] = useState(false);

  // City state
  const [selectedCity, setSelectedCity] = useState<USCity | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  // Collapse/expand state for sections
  const [eventTypeExpanded, setEventTypeExpanded] = useState(true);
  const [sportTypeExpanded, setSportTypeExpanded] = useState(true);
  const [teamsExpanded, setTeamsExpanded] = useState(true);

  // Determine if fields should be unlocked
  const isTeamSport = sportType === 'nfl' || sportType === 'mlb';
  const fieldsUnlocked = useMemo(() => {
    if (!eventType) return false;
    if (eventType === 'sports') {
      if (!sportType) return false;
      if (isTeamSport) return !!(homeTeam && awayTeam);
      return true;
    }
    return true;
  }, [eventType, sportType, isTeamSport, homeTeam, awayTeam]);

  const resetForm = () => {
    setEventType(''); setSportType(''); setEventName(''); setVenue('');
    setEventDate(new Date()); setDateSelected(false); setShowDatePicker(false);
    setPhotos([]); setCoverPhoto(null);
    setHomeTeam(null); setAwayTeam(null); setHomeTeamQuery(''); setAwayTeamQuery('');
    setShowHomeDropdown(false); setShowAwayDropdown(false);
    setSelectedCity(null); setCityQuery(''); setShowCityDropdown(false);
    setEventTypeExpanded(true); setSportTypeExpanded(true); setTeamsExpanded(true);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setModalVisible(false);
    resetForm();
  };

  const handleSelectType = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === eventType) return;
    // Reset downstream fields
    setSportType(''); setEventName(''); setVenue('');
    setEventDate(new Date()); setDateSelected(false); setPhotos([]);
    setHomeTeam(null); setAwayTeam(null); setHomeTeamQuery(''); setAwayTeamQuery('');
    setShowHomeDropdown(false); setShowAwayDropdown(false);
    setSelectedCity(null); setCityQuery(''); setShowCityDropdown(false);
    setSportTypeExpanded(true); setTeamsExpanded(true);
    setEventType(type);
    setEventTypeExpanded(false);
  };

  const handleSelectSportType = (type: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === sportType) return;
    setEventName(''); setVenue('');
    setEventDate(new Date()); setDateSelected(false); setPhotos([]);
    setHomeTeam(null); setAwayTeam(null); setHomeTeamQuery(''); setAwayTeamQuery('');
    setShowHomeDropdown(false); setShowAwayDropdown(false);
    setSelectedCity(null); setCityQuery(''); setShowCityDropdown(false);
    setTeamsExpanded(true);
    setSportType(type);
    setSportTypeExpanded(false);
  };

  const handleDatePress = () => {
    Keyboard.dismiss();
    setShowCityDropdown(false);
    setShowHomeDropdown(false);
    setShowAwayDropdown(false);
    setShowDatePicker(true);
  };

  const confirmDateSelection = () => {
    setDateSelected(true);
    setShowDatePicker(false);
  };

  const formatDisplayDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const formatDateForDB = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const getPrompts = () => {
    const whereWhen = { where: 'Where was it?', when: 'When was it?' };
    if (eventType === 'sports') {
      switch (sportType) {
        case 'nfl': return { name: '49ers vs Chiefs...', ...whereWhen };
        case 'mlb': return { name: 'Yankees vs Red Sox...', ...whereWhen };
        case 'nba': return { name: 'Warriors vs Celtics...', ...whereWhen };
        case 'soccer': return { name: 'Real Madrid vs Barcelona...', ...whereWhen };
        case 'tennis': return { name: 'Alcaraz vs Djokovic...', ...whereWhen };
        case 'other': return { name: '2026 Winter Olympics...', ...whereWhen };
        default: return { name: 'Team vs Team...', ...whereWhen };
      }
    }
    switch (eventType) {
      case 'concert': return { name: 'Who did you see?', ...whereWhen };
      case 'theater': return { name: 'What was the show?', ...whereWhen };
      case 'comedy': return { name: 'Who was the comedian?', ...whereWhen };
      case 'landmark': return { name: 'What was the landmark?', ...whereWhen };
      default: return { name: 'What was the experience?', ...whereWhen };
    }
  };

  // Team helpers
  const getTeamsList = (): SportTeam[] => sportType === 'nfl' ? NFL_TEAMS : sportType === 'mlb' ? MLB_TEAMS : [];
  const sortedTeams = [...getTeamsList()].sort((a, b) => a.fullName.localeCompare(b.fullName));

  const getFilteredTeams = (query: string, excludeTeam: SportTeam | null) => sortedTeams.filter(team => {
    if (excludeTeam && team.name === excludeTeam.name) return false;
    if (!query) return true;
    return team.name.toLowerCase().includes(query.toLowerCase()) || team.city.toLowerCase().includes(query.toLowerCase()) || team.fullName.toLowerCase().includes(query.toLowerCase());
  });

  // City helpers
  const getFilteredCities = (query: string) => {
    if (!query) return SORTED_CITIES.slice(0, 5);
    return SORTED_CITIES.filter(city => city.displayName.toLowerCase().includes(query.toLowerCase()) || city.city.toLowerCase().includes(query.toLowerCase()) || city.state.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  };

  const selectHomeTeam = (team: SportTeam) => {
    setHomeTeam(team); setHomeTeamQuery(team.fullName); setShowHomeDropdown(false);
    setVenue(team.stadium);
    if (awayTeam) {
      setEventName(`${team.name} vs ${awayTeam.name}`);
      setTeamsExpanded(false);
    }
    Keyboard.dismiss();
  };
  const selectAwayTeam = (team: SportTeam) => {
    setAwayTeam(team); setAwayTeamQuery(team.fullName); setShowAwayDropdown(false);
    if (homeTeam) {
      setEventName(`${homeTeam.name} vs ${team.name}`);
      setTeamsExpanded(false);
    }
    Keyboard.dismiss();
  };
  const selectCity = (city: USCity) => { setSelectedCity(city); setCityQuery(city.displayName); setShowCityDropdown(false); Keyboard.dismiss(); };

  const handleCitySubmit = () => {
    const filteredCities = getFilteredCities(cityQuery);
    if (filteredCities.length > 0) selectCity(filteredCities[0]);
    else { setShowCityDropdown(false); Keyboard.dismiss(); }
  };

  // Photo pickers
  const pickCoverPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photos'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled) setCoverPhoto(result.assets[0].uri);
  };

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photos'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 6 - photos.length, quality: 0.8 });
    if (!result.canceled) setPhotos([...photos, ...result.assets.map(a => a.uri)].slice(0, 6));
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleSubmit = async () => {
    // Validate
    const finalName = isTeamSport && homeTeam && awayTeam ? `${homeTeam.name} vs ${awayTeam.name}` : eventName;
    if (!finalName) { Alert.alert('Missing Info', 'Please enter an event name'); return; }
    if (!isTeamSport && !selectedCity && eventType !== 'sports') { Alert.alert('Missing Info', 'Please select a location'); return; }
    if (eventType === 'sports' && !isTeamSport && !selectedCity) { Alert.alert('Missing Info', 'Please select a location'); return; }
    if (!dateSelected) { Alert.alert('Missing Info', 'Please select a date'); return; }

    setLoading(true);
    try {
      const eventData: any = {
        title: finalName,
        type: eventType,
        sport: eventType === 'sports' ? sportType : null,
        venue: isTeamSport ? venue : (selectedCity?.displayName || venue),
        venue_location: selectedCity?.displayName || null,
        date: formatDateForDB(eventDate),
        photos: photos.length > 0 ? photos : [],
        cover_photo: coverPhoto || null,
      };

      if (selectedCity && !isTeamSport) {
        eventData.latitude = selectedCity.latitude;
        eventData.longitude = selectedCity.longitude;
      }

      if (isTeamSport && homeTeam && awayTeam) {
        eventData.home_team = { name: homeTeam.name, city: homeTeam.city, fullName: homeTeam.fullName };
        eventData.away_team = { name: awayTeam.name, city: awayTeam.city, fullName: awayTeam.fullName };
      }

      if (isGuest) {
        await saveLocalEvent(eventData);
      } else if (user) {
        const { error } = await supabase.from('events').insert([{ ...eventData, user_id: user.id }]).select();
        if (error) throw error;
      }

      Keyboard.dismiss();
      setModalVisible(false);
      resetForm();
      triggerConfetti();
      onEventAdded();

    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER HELPERS ---

  const renderTeamDropdown = (teams: SportTeam[], onSelect: (team: SportTeam) => void, show: boolean) => {
    if (!show || teams.length === 0) return null;
    return (
      <View style={styles.dropdown}>
        <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="always" nestedScrollEnabled>
          {teams.slice(0, 5).map((team, index) => (
            <TouchableOpacity key={team.name} style={[styles.dropdownItem, index === 0 && styles.dropdownItemFirst]} onPress={() => onSelect(team)}>
              <Text style={styles.dropdownItemText}>{team.fullName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCityDropdown = () => {
    const filteredCities = getFilteredCities(cityQuery);
    if (!showCityDropdown || filteredCities.length === 0) return null;
    return (
      <View style={styles.dropdown}>
        <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="always" nestedScrollEnabled>
          {filteredCities.map((city, index) => (
            <TouchableOpacity key={`${city.city}-${city.stateCode}`} style={[styles.dropdownItem, index === 0 && styles.dropdownItemFirst]} onPress={() => selectCity(city)}>
              <Text style={styles.dropdownItemText}>{city.displayName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const prompts = getPrompts();

  return (
    <>
      <TouchableOpacity style={[styles.fab, { bottom: 24 }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setModalVisible(true); }}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {showConfetti && (
        <ConfettiCannon count={150} origin={{ x: SCREEN_WIDTH / 2, y: -20 }} fadeOut explosionSpeed={400} fallSpeed={2500} colors={[COLORS.navy, '#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']} autoStart />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
            {/* Background gradient that extends behind form */}
            <LinearGradient
              colors={coverPhoto ? ['rgba(0,0,0,0.3)', 'rgba(30,58,95,0.85)', COLORS.cream] : ['#1e3a5f', '#2a6a7a', '#7ab5b0', '#b8d5d1', COLORS.cream]}
              locations={coverPhoto ? [0, 0.4, 1] : [0, 0.15, 0.35, 0.5, 0.7]}
              style={styles.backgroundGradient}
            />
            {coverPhoto ? (
              <Image source={{ uri: coverPhoto }} style={styles.coverPhotoBackground} resizeMode="cover" />
            ) : null}

            {/* Header - fixed top row */}
            <View style={styles.headerTopRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>New Event</Text>
              <View style={styles.cancelButton} />
            </View>

            {/* Scrollable content - includes cover photo button and form */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.formBody}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Cover photo button */}
              <View style={styles.coverPhotoCenter}>
                <TouchableOpacity style={styles.coverPhotoButton} onPress={pickCoverPhoto}>
                  <Ionicons name="camera-outline" size={16} color={COLORS.white} />
                  <Text style={styles.coverPhotoText}>{coverPhoto ? 'Change cover photo' : 'Pick a cover photo'}</Text>
                </TouchableOpacity>
              </View>
              {/* Event Type Section - collapsible */}
              <TouchableOpacity
                style={styles.sectionCard}
                onPress={() => { if (eventType) setEventTypeExpanded(!eventTypeExpanded); }}
                activeOpacity={eventType ? 0.7 : 1}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Select an Event type</Text>
                  {eventType && !eventTypeExpanded && (
                    <Text style={styles.sectionSelectedLabel}>
                      {EVENT_TYPES.find(t => t.value === eventType)?.label}
                    </Text>
                  )}
                </View>
                {eventTypeExpanded && (
                  <View style={styles.pillGrid}>
                    {EVENT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={[styles.pill, eventType === type.value && styles.pillActive]}
                        onPress={() => handleSelectType(type.value)}
                      >
                        <Text style={styles.pillEmoji}>{type.emoji}</Text>
                        <Text style={[styles.pillLabel, eventType === type.value && styles.pillLabelActive]}>{type.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </TouchableOpacity>

              {/* Sport Type Section - collapsible */}
              {eventType === 'sports' && (
                <TouchableOpacity
                  style={styles.sectionCard}
                  onPress={() => { if (sportType) setSportTypeExpanded(!sportTypeExpanded); }}
                  activeOpacity={sportType ? 0.7 : 1}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Select a Sport</Text>
                    {sportType && !sportTypeExpanded && (
                      <Text style={styles.sectionSelectedLabel}>
                        {SPORT_TYPES.find(t => t.value === sportType)?.label}
                      </Text>
                    )}
                  </View>
                  {sportTypeExpanded && (
                    <View style={styles.pillGrid}>
                      {SPORT_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          style={[styles.pill, sportType === type.value && styles.pillActive]}
                          onPress={() => handleSelectSportType(type.value)}
                        >
                          <Text style={styles.pillEmoji}>{type.emoji}</Text>
                          <Text style={[styles.pillLabel, sportType === type.value && styles.pillLabelActive]}>{type.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Team Selection - collapsible, NFL/MLB only */}
              {isTeamSport && (
                <TouchableOpacity
                  style={[styles.sectionCard, { zIndex: 20 }]}
                  onPress={() => { if (homeTeam && awayTeam) setTeamsExpanded(!teamsExpanded); }}
                  activeOpacity={homeTeam && awayTeam ? 0.7 : 1}
                >
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Select the Teams</Text>
                    {homeTeam && awayTeam && !teamsExpanded && (
                      <Text style={styles.sectionSelectedLabel}>
                        {homeTeam.name} vs {awayTeam.name}
                      </Text>
                    )}
                  </View>
                  {teamsExpanded && (
                    <View style={styles.teamRow}>
                      <View style={[styles.teamColumn, { zIndex: 20 }]}>
                        <Text style={styles.teamLabel}>Home Team</Text>
                        <View style={styles.inputWithDropdown}>
                          <TextInput
                            style={styles.teamInput}
                            placeholder="Search teams.."
                            placeholderTextColor={COLORS.grayLight}
                            value={homeTeamQuery}
                            onChangeText={(t) => { setHomeTeamQuery(t); setShowHomeDropdown(true); if (homeTeam && t !== homeTeam.fullName) { setHomeTeam(null); setVenue(''); setEventName(''); } }}
                            onFocus={() => { setShowHomeDropdown(true); setShowAwayDropdown(false); }}
                          />
                          {renderTeamDropdown(getFilteredTeams(homeTeamQuery, awayTeam), selectHomeTeam, showHomeDropdown)}
                        </View>
                      </View>
                      <Text style={styles.vsText}>vs</Text>
                      <View style={[styles.teamColumn, { zIndex: 10 }]}>
                        <Text style={styles.teamLabel}>Away Team</Text>
                        <View style={styles.inputWithDropdown}>
                          <TextInput
                            style={styles.teamInput}
                            placeholder="Search teams.."
                            placeholderTextColor={COLORS.grayLight}
                            value={awayTeamQuery}
                            onChangeText={(t) => { setAwayTeamQuery(t); setShowAwayDropdown(true); if (awayTeam && t !== awayTeam.fullName) { setAwayTeam(null); setEventName(''); } }}
                            onFocus={() => { setShowAwayDropdown(true); setShowHomeDropdown(false); }}
                          />
                          {renderTeamDropdown(getFilteredTeams(awayTeamQuery, homeTeam), selectAwayTeam, showAwayDropdown)}
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Name Field */}
              <View style={[styles.fieldRow, !fieldsUnlocked && styles.fieldDisabled]}>
                <Ionicons name="text-outline" size={20} color={fieldsUnlocked ? COLORS.navy : COLORS.grayLight} style={styles.fieldIcon} />
                {isTeamSport && fieldsUnlocked ? (
                  <View style={styles.fieldTextContainer}>
                    <Text style={styles.fieldFilledText}>{eventName}</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                  </View>
                ) : (
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={prompts.name}
                    placeholderTextColor={COLORS.grayLight}
                    value={eventName}
                    onChangeText={setEventName}
                    editable={fieldsUnlocked && !isTeamSport}
                    returnKeyType="next"
                  />
                )}
              </View>

              {/* Where Field */}
              <View style={[styles.fieldRow, !fieldsUnlocked && styles.fieldDisabled, { zIndex: 10 }]}>
                <Ionicons name="location-outline" size={20} color={fieldsUnlocked ? COLORS.navy : COLORS.grayLight} style={styles.fieldIcon} />
                {isTeamSport && fieldsUnlocked ? (
                  <View style={styles.fieldTextContainer}>
                    <Text style={styles.fieldFilledText}>{venue}</Text>
                    <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                  </View>
                ) : fieldsUnlocked ? (
                  <View style={{ flex: 1 }}>
                    <View style={styles.inputWithDropdown}>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder={prompts.where}
                        placeholderTextColor={COLORS.grayLight}
                        value={cityQuery}
                        onChangeText={(t) => { setCityQuery(t); setShowCityDropdown(true); if (selectedCity && t !== selectedCity.displayName) setSelectedCity(null); }}
                        onFocus={() => setShowCityDropdown(true)}
                        onSubmitEditing={handleCitySubmit}
                        returnKeyType="done"
                      />
                      {renderCityDropdown()}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.fieldPlaceholder}>{prompts.where}</Text>
                )}
              </View>

              {/* When Field */}
              <Pressable
                style={[styles.fieldRow, !fieldsUnlocked && styles.fieldDisabled]}
                onPress={fieldsUnlocked ? handleDatePress : undefined}
              >
                <Ionicons name="calendar-outline" size={20} color={fieldsUnlocked ? COLORS.navy : COLORS.grayLight} style={styles.fieldIcon} />
                <Text style={[styles.fieldInput, { color: dateSelected ? COLORS.navy : COLORS.grayLight }]}>
                  {dateSelected ? formatDisplayDate(eventDate) : prompts.when}
                </Text>
              </Pressable>

              {/* Photos Field */}
              <Pressable
                style={[styles.fieldRow, !fieldsUnlocked && styles.fieldDisabled]}
                onPress={fieldsUnlocked ? pickPhotos : undefined}
              >
                <Ionicons name="images-outline" size={20} color={fieldsUnlocked ? COLORS.navy : COLORS.grayLight} style={styles.fieldIcon} />
                <Text style={[styles.fieldInput, { color: photos.length > 0 ? COLORS.navy : COLORS.grayLight, flex: 1 }]}>
                  {photos.length > 0 ? `${photos.length} picture${photos.length > 1 ? 's' : ''} uploaded` : 'Upload Pictures'}
                </Text>
                {fieldsUnlocked && (
                  <Ionicons name="add-outline" size={22} color={COLORS.grayLight} />
                )}
              </Pressable>

              {/* Photo thumbnails */}
              {photos.length > 0 && (
                <View style={styles.photoThumbs}>
                  {photos.map((uri, i) => (
                    <TouchableOpacity key={i} style={styles.photoThumb} onPress={() => setPhotos(photos.filter((_, idx) => idx !== i))}>
                      <Image source={{ uri }} style={styles.photoImage} />
                      <View style={styles.photoRemove}><Text style={styles.photoRemoveText}>✕</Text></View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Spacer for bottom button */}
              <View style={{ height: 80 }} />
            </ScrollView>

            {/* Create Event Button - fixed at bottom */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.md }]}>
              <TouchableOpacity
                style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.createButtonText}>Create Event</Text>}
              </TouchableOpacity>
            </View>

            {/* Date Picker Overlay */}
            {showDatePicker && (
              <View style={styles.datePickerOverlay}>
                <View style={styles.datePickerModal}>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <CalendarPicker
                    selectedDate={eventDate}
                    onDateChange={(d) => { setEventDate(d); setDateSelected(true); }}
                    maximumDate={new Date(2030, 11, 31)}
                    minimumDate={new Date(1950, 0, 1)}
                  />
                  <Pressable style={styles.dateConfirmButton} onPress={confirmDateSelection}>
                    <Text style={styles.dateConfirmText}>Confirm Date</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', right: 20, width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 100,
  },
  fabIcon: { color: COLORS.white, fontSize: 32, fontWeight: '300', marginTop: -2 },

  // Modal root
  modalRoot: { flex: 1, backgroundColor: COLORS.cream, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },

  // Background gradient
  backgroundGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 400,
  },
  coverPhotoBackground: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 250,
  },

  // Header
  headerTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
    zIndex: 10,
  },
  cancelButton: { minWidth: 80 },
  cancelText: {
    fontFamily: FONTS.medium, fontSize: FONT_SIZES.md, color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 6, paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.full, overflow: 'hidden', textAlign: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.medium, fontSize: FONT_SIZES.lg, color: COLORS.white,
  },
  coverPhotoCenter: {
    alignItems: 'center', paddingVertical: 40,
  },
  coverPhotoButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.full, gap: 6,
  },
  coverPhotoText: {
    fontFamily: FONTS.medium, fontSize: FONT_SIZES.sm, color: COLORS.white,
  },

  // Form body
  formBody: { flex: 1 },
  formContent: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },

  // Sections
  sectionCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: '#E5E5E5',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONTS.medium, fontSize: FONT_SIZES.lg, color: COLORS.navy,
  },
  sectionSelectedLabel: {
    fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.sm, color: '#E91E8C',
  },

  // Pills
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  pill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.full,
    paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#E5E5E5',
    width: (SCREEN_WIDTH - SPACING.lg * 4 - SPACING.sm * 2 - 2) / 3,
  },
  pillActive: {
    backgroundColor: COLORS.navy, borderColor: COLORS.navy,
  },
  pillEmoji: { fontSize: 16 },
  pillLabel: {
    fontFamily: FONTS.medium, fontSize: FONT_SIZES.sm, color: COLORS.navy,
  },
  pillLabelActive: { color: COLORS.white },

  // Team selection
  teamRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: SPACING.md },
  teamColumn: { flex: 1 },
  teamLabel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.sm, color: COLORS.navy, marginBottom: SPACING.xs },
  teamInput: {
    fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.grayLight,
  },
  vsText: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, color: COLORS.navy, marginHorizontal: SPACING.sm, marginTop: 28 },

  // Dropdowns
  inputWithDropdown: { position: 'relative', zIndex: 10 },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.grayLight, marginTop: 4,
    maxHeight: 200, zIndex: 1000, elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  dropdownScroll: { maxHeight: 200 },
  dropdownItem: { padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.grayLight },
  dropdownItemFirst: { borderTopWidth: 0 },
  dropdownItemText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy },

  // Field rows
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14, paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1, borderColor: '#E5E5E5',
  },
  fieldDisabled: {
    backgroundColor: '#F0F0F0', borderColor: '#E8E8E8',
  },
  fieldIcon: { marginRight: SPACING.md },
  fieldInput: {
    fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy, flex: 1,
  },
  fieldPlaceholder: {
    fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.grayLight, flex: 1,
  },
  fieldTextContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  fieldFilledText: {
    fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy, flex: 1,
  },

  // Photo thumbnails
  photoThumbs: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md,
  },
  photoThumb: { width: 70, height: 70, borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },

  // Bottom bar
  bottomBar: {
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
    backgroundColor: COLORS.cream,
    borderTopWidth: 1, borderTopColor: '#E5E5E5',
  },
  createButton: {
    backgroundColor: COLORS.navy, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: {
    fontFamily: FONTS.medium, fontSize: FONT_SIZES.md, color: COLORS.white,
  },

  // Date picker overlay
  datePickerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  },
  datePickerModal: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, width: '85%', alignItems: 'center',
  },
  datePickerTitle: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.lg, color: COLORS.navy, marginBottom: SPACING.md },
  dateConfirmButton: {
    backgroundColor: COLORS.navy, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md, width: '100%',
  },
  dateConfirmText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.white },
});
