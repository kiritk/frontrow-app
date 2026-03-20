import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Platform, Alert, ActivityIndicator, Image, Animated,
  PanResponder, Dimensions, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import { NFL_TEAMS, NFLTeam } from '../data/nflTeams';
import { MLB_TEAMS, MLBTeam } from '../data/mlbTeams';
import { SORTED_CITIES, USCity } from '../data/usCities';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const EVENT_TYPES = [
  { value: 'concert', label: 'Concerts', subtitle: 'Live music', emoji: '🎸' },
  { value: 'sports', label: 'Sports', subtitle: 'Games & matches', emoji: '🏆' },
  { value: 'theater', label: 'Theater', subtitle: 'Shows & plays', emoji: '🎭' },
  { value: 'comedy', label: 'Comedy', subtitle: 'Stand-up & improv', emoji: '🎤' },
  { value: 'landmark', label: 'Landmarks', subtitle: 'Famous places', emoji: '🏰' },
  { value: 'other', label: 'Other', subtitle: 'Everything else', emoji: '✨' },
];

const SPORT_TYPES = [
  { value: 'nfl', label: 'NFL', emoji: '🏈' },
  { value: 'mlb', label: 'MLB', emoji: '⚾' },
  { value: 'nba', label: 'NBA', emoji: '🏀' },
  { value: 'soccer', label: 'Soccer', emoji: '⚽' },
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'other', label: 'Other', emoji: '🏅' },
];

type Step = 'type' | 'sport-type' | 'details' | 'photos';
type SportTeam = NFLTeam | MLBTeam;

export default function AddEventButton({ onEventAdded }: { onEventAdded: () => void }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('type');
  const [eventType, setEventType] = useState('');
  const [sportType, setSportType] = useState('');
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateSelected, setDateSelected] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [cityInputFocused, setCityInputFocused] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [homeTeam, setHomeTeam] = useState<SportTeam | null>(null);
  const [awayTeam, setAwayTeam] = useState<SportTeam | null>(null);
  const [homeTeamQuery, setHomeTeamQuery] = useState('');
  const [awayTeamQuery, setAwayTeamQuery] = useState('');
  const [showHomeDropdown, setShowHomeDropdown] = useState(false);
  const [showAwayDropdown, setShowAwayDropdown] = useState(false);

  const [selectedCity, setSelectedCity] = useState<USCity | null>(null);
  const [cityQuery, setCityQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const homeInputRef = useRef<TextInput>(null);
  const awayInputRef = useRef<TextInput>(null);
  const cityInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const confettiRef = useRef<any>(null);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalOffsetAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }).start(() => {
            handleClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (modalVisible) {
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    }
  }, [modalVisible]);

  useEffect(() => {
    Animated.timing(modalOffsetAnim, {
      toValue: cityInputFocused ? -150 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [cityInputFocused]);

  const resetForm = () => { 
    setStep('type'); setEventType(''); setSportType(''); setEventName(''); setVenue(''); 
    setEventDate(new Date()); setDateSelected(false); setShowDatePicker(false); setPhotos([]);
    setHomeTeam(null); setAwayTeam(null); setHomeTeamQuery(''); setAwayTeamQuery('');
    setShowHomeDropdown(false); setShowAwayDropdown(false);
    setSelectedCity(null); setCityQuery(''); setShowCityDropdown(false); setCityInputFocused(false);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setCityInputFocused(false);
    Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => {
      setModalVisible(false);
      resetForm();
    });
  };

  const handleSelectType = (type: string) => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEventType(type); 
    setStep(type === 'sports' ? 'sport-type' : 'details'); 
  };
  
  const handleSelectSportType = (type: string) => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSportType(type); 
    setStep('details'); 
  };
  
  const handleDetailsNext = () => { 
    const isTeamSport = sportType === 'nfl' || sportType === 'mlb';
    if (isTeamSport) {
      if (!homeTeam || !awayTeam || !venue || !dateSelected) { Alert.alert('Error', 'Please fill in all fields'); return; }
      setEventName(`${homeTeam.name} vs ${awayTeam.name}`);
    } else if (eventType === 'sports') {
      if (!eventName || !venue || !dateSelected) { Alert.alert('Error', 'Please fill in all fields'); return; }
    } else {
      if (!eventName || !selectedCity || !dateSelected) { Alert.alert('Error', 'Please fill in all fields'); return; }
      setVenue(selectedCity.displayName);
    }
    setStep('photos'); 
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') { setShowDatePicker(false); return; }
    if (selectedDate) { setEventDate(selectedDate); setDateSelected(true); }
    if (Platform.OS === 'android') setShowDatePicker(false);
  };

  const confirmDateSelection = () => { setDateSelected(true); setShowDatePicker(false); };
  const formatDisplayDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const formatDateForDB = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photos'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 6 - photos.length, quality: 0.8 });
    if (!result.canceled) setPhotos([...photos, ...result.assets.map(a => a.uri)].slice(0, 6));
  };

  const removePhoto = (index: number) => setPhotos(photos.filter((_, i) => i !== index));

  const triggerConfetti = () => {
    setShowConfetti(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleSubmit = async () => {
    if (!user) { Alert.alert('Error', 'You must be logged in'); return; }
    setLoading(true);
    try {
      const isTeamSport = sportType === 'nfl' || sportType === 'mlb';
      const finalEventName = isTeamSport && homeTeam && awayTeam ? `${homeTeam.name} vs ${awayTeam.name}` : eventName;
      const eventData: any = {
        user_id: user.id, title: finalEventName, type: eventType,
        sport: eventType === 'sports' ? sportType : null,
        venue: isTeamSport ? venue : (selectedCity?.displayName || venue),
        venue_location: selectedCity?.displayName || null,
        date: formatDateForDB(eventDate),
        photos: photos.length > 0 ? photos : [],
      };
      if (selectedCity && !isTeamSport) {
        eventData.latitude = selectedCity.latitude;
        eventData.longitude = selectedCity.longitude;
      }
      if (isTeamSport && homeTeam && awayTeam) {
        eventData.home_team = { name: homeTeam.name, city: homeTeam.city, fullName: homeTeam.fullName };
        eventData.away_team = { name: awayTeam.name, city: awayTeam.city, fullName: awayTeam.fullName };
      }
      const { error } = await supabase.from('events').insert([eventData]).select();
      if (error) throw error;
      
      // Close modal first, then trigger confetti
      Keyboard.dismiss();
      setCityInputFocused(false);
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => {
        setModalVisible(false);
        resetForm();
        triggerConfetti();
        onEventAdded();
      });
      
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const getEventEmoji = () => eventType === 'sports' ? (SPORT_TYPES.find(s => s.value === sportType)?.emoji || '🏆') : (EVENT_TYPES.find(e => e.value === eventType)?.emoji || '🎫');
  const getPrompts = () => {
    if (eventType === 'sports') {
      switch (sportType) {
        case 'nfl': return { name: 'Who played?', placeholder: '49ers vs Chiefs...' };
        case 'mlb': return { name: 'Who played?', placeholder: 'Yankees vs Red Sox...' };
        case 'nba': return { name: 'Who played?', placeholder: 'Warriors vs Celtics...' };
        case 'soccer': return { name: 'Who played?', placeholder: 'Real Madrid vs Barcelona...' };
        case 'tennis': return { name: 'Who played?', placeholder: 'Alcaraz vs Djokovic...' };
        case 'other': return { name: 'What was the event?', placeholder: '2026 Winter Olympics...' };
        default: return { name: 'Who played?', placeholder: 'Team vs Team...' };
      }
    }
    switch (eventType) {
      case 'concert': return { name: 'Who did you see?', placeholder: 'Taylor Swift, The Weeknd...' };
      case 'theater': return { name: 'What was the show?', placeholder: 'Hamilton, Wicked...' };
      case 'comedy': return { name: 'Who was the comedian?', placeholder: 'Dave Chappelle...' };
      case 'landmark': return { name: 'What was the landmark?', placeholder: 'Eiffel Tower...' };
      default: return { name: 'What was the experience?', placeholder: 'Describe...' };
    }
  };

  const getTeamsList = (): SportTeam[] => sportType === 'nfl' ? NFL_TEAMS : sportType === 'mlb' ? MLB_TEAMS : [];
  const sortedTeams = [...getTeamsList()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  
  const getFilteredTeams = (query: string, excludeTeam: SportTeam | null) => sortedTeams.filter(team => {
    if (excludeTeam && team.name === excludeTeam.name) return false;
    if (!query) return true;
    return team.name.toLowerCase().includes(query.toLowerCase()) || team.city.toLowerCase().includes(query.toLowerCase()) || team.fullName.toLowerCase().includes(query.toLowerCase());
  });

  const getFilteredCities = (query: string) => {
    if (!query) return SORTED_CITIES.slice(0, 5);
    return SORTED_CITIES.filter(city => city.displayName.toLowerCase().includes(query.toLowerCase()) || city.city.toLowerCase().includes(query.toLowerCase()) || city.state.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  };

  const selectHomeTeam = (team: SportTeam) => { setHomeTeam(team); setHomeTeamQuery(team.fullName); setShowHomeDropdown(false); setVenue(team.stadium); Keyboard.dismiss(); };
  const selectAwayTeam = (team: SportTeam) => { setAwayTeam(team); setAwayTeamQuery(team.fullName); setShowAwayDropdown(false); Keyboard.dismiss(); };
  const selectCity = (city: USCity) => { setSelectedCity(city); setCityQuery(city.displayName); setShowCityDropdown(false); setCityInputFocused(false); Keyboard.dismiss(); };

  const handleCityInputFocus = () => { setCityInputFocused(true); setShowCityDropdown(true); };
  const handleCitySubmit = () => {
    const filteredCities = getFilteredCities(cityQuery);
    if (filteredCities.length > 0) selectCity(filteredCities[0]);
    else { setCityInputFocused(false); setShowCityDropdown(false); Keyboard.dismiss(); }
  };

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

  const renderTeamSelection = () => {
    const homeFiltered = getFilteredTeams(homeTeamQuery, awayTeam);
    const awayFiltered = getFilteredTeams(awayTeamQuery, homeTeam);
    return (
      <View style={styles.teamContainer}>
        <View style={styles.teamRow}>
          <View style={styles.teamColumn}>
            <Text style={styles.teamLabel}>Home Team</Text>
            <View style={styles.inputWithDropdown}>
              <TextInput ref={homeInputRef} style={styles.teamInput} placeholder="Search teams.." placeholderTextColor={COLORS.grayLight} value={homeTeamQuery}
                onChangeText={(t) => { setHomeTeamQuery(t); setShowHomeDropdown(true); if (homeTeam && t !== homeTeam.fullName) setHomeTeam(null); }}
                onFocus={() => { setShowHomeDropdown(true); setShowAwayDropdown(false); }} />
              {renderTeamDropdown(homeFiltered, selectHomeTeam, showHomeDropdown)}
            </View>
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.teamColumn}>
            <Text style={styles.teamLabel}>Away Team</Text>
            <View style={styles.inputWithDropdown}>
              <TextInput ref={awayInputRef} style={styles.teamInput} placeholder="Search teams.." placeholderTextColor={COLORS.grayLight} value={awayTeamQuery}
                onChangeText={(t) => { setAwayTeamQuery(t); setShowAwayDropdown(true); if (awayTeam && t !== awayTeam.fullName) setAwayTeam(null); }}
                onFocus={() => { setShowAwayDropdown(true); setShowHomeDropdown(false); }} />
              {renderTeamDropdown(awayFiltered, selectAwayTeam, showAwayDropdown)}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderCitySelection = () => (
    <View style={[styles.inputGroup, { zIndex: 10 }]}>
      <Text style={styles.label}>Location (City/State)</Text>
      <View style={styles.inputWithDropdown}>
        <TextInput ref={cityInputRef} style={styles.input} placeholder="Search cities..." placeholderTextColor={COLORS.grayLight} value={cityQuery}
          onChangeText={(t) => { setCityQuery(t); setShowCityDropdown(true); if (selectedCity && t !== selectedCity.displayName) setSelectedCity(null); }}
          onFocus={handleCityInputFocus} onSubmitEditing={handleCitySubmit} returnKeyType="done" />
        {renderCityDropdown()}
      </View>
    </View>
  );

  const renderTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What type of event?</Text>
      <Text style={styles.stepSubtitle}>Choose a category</Text>
      <View style={styles.typeGrid}>
        {EVENT_TYPES.map((type) => (
          <TouchableOpacity key={type.value} style={styles.typeCard} onPress={() => handleSelectType(type.value)}>
            <Text style={styles.typeEmoji}>{type.emoji}</Text>
            <Text style={styles.typeLabel}>{type.label}</Text>
            <Text style={styles.typeSubtitleText}>{type.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSportTypeSelection = () => (
    <View style={styles.stepContent}>
      <TouchableOpacity onPress={() => setStep('type')} style={styles.backButton}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <Text style={styles.stepTitle}>What sport?</Text>
      <Text style={styles.stepSubtitle}>Choose a league</Text>
      <View style={styles.sportGrid}>
        {SPORT_TYPES.map((type) => (
          <TouchableOpacity key={type.value} style={styles.sportCard} onPress={() => handleSelectSportType(type.value)}>
            <Text style={styles.sportEmoji}>{type.emoji}</Text>
            <Text style={styles.sportLabel}>{type.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDetails = () => {
    const prompts = getPrompts();
    const isTeamSport = sportType === 'nfl' || sportType === 'mlb';
    const isNonSportsEvent = eventType !== 'sports';
    return (
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowHomeDropdown(false); setShowAwayDropdown(false); setShowCityDropdown(false); setCityInputFocused(false); }}>
        <View style={styles.stepContent}>
          <TouchableOpacity onPress={() => setStep(eventType === 'sports' ? 'sport-type' : 'type')} style={styles.backButton}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
          <Text style={styles.stepTitle}>The Details</Text>
          <Text style={styles.stepSubtitle}>Tell us about your experience</Text>
          {isTeamSport ? renderTeamSelection() : (
            <View style={[styles.inputGroup, isNonSportsEvent && { zIndex: -1 }]}>
              <Text style={styles.label}>{prompts.name}</Text>
              <TextInput style={styles.input} placeholder={prompts.placeholder} placeholderTextColor={COLORS.grayLight} value={eventName} onChangeText={setEventName} returnKeyType="next" blurOnSubmit
                onFocus={() => { setShowCityDropdown(false); setCityInputFocused(false); }} />
            </View>
          )}
          {isNonSportsEvent ? renderCitySelection() : (
            <View style={[styles.inputGroup, isTeamSport && { zIndex: -1 }]}>
              <Text style={styles.label}>Where was it?</Text>
              <TextInput style={styles.input} placeholder="Venue, City" placeholderTextColor={COLORS.grayLight} value={venue} onChangeText={setVenue} returnKeyType="done" blurOnSubmit />
            </View>
          )}
          <View style={[styles.inputGroup, { zIndex: -2 }]}>
            <Text style={styles.label}>When was it?</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => { Keyboard.dismiss(); setCityInputFocused(false); setShowDatePicker(true); }}>
              <Text style={[styles.dateButtonText, !dateSelected && styles.dateButtonPlaceholder]}>{dateSelected ? formatDisplayDate(eventDate) : 'Select a date'}</Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.nextButton, { zIndex: -2 }]} onPress={handleDetailsNext}><Text style={styles.nextButtonText}>Next</Text></TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const renderPhotos = () => {
    const isTeamSport = sportType === 'nfl' || sportType === 'mlb';
    const displayTitle = isTeamSport && homeTeam && awayTeam ? `${homeTeam.name} vs ${awayTeam.name}` : eventName;
    const displayLocation = isTeamSport ? venue : (selectedCity?.displayName || venue);
    return (
      <View style={styles.stepContent}>
        <TouchableOpacity onPress={() => setStep('details')} style={styles.backButton}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
        <View style={styles.photoHeader}>
          <Text style={styles.photoEmoji}>{getEventEmoji()}</Text>
          <Text style={styles.photoEventName}>{displayTitle}</Text>
          <Text style={styles.photoEventLocation}>{displayLocation}</Text>
        </View>
        <Text style={styles.photoPrompt}>Add up to 6 photos to remember this moment</Text>
        <View style={styles.photoGrid}>
          {photos.map((uri, i) => (
            <TouchableOpacity key={i} style={styles.photoThumb} onPress={() => removePhoto(i)}>
              <Image source={{ uri }} style={styles.photoImage} />
              <View style={styles.photoRemove}><Text style={styles.photoRemoveText}>✕</Text></View>
            </TouchableOpacity>
          ))}
          {photos.length < 6 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImages}>
              <Text style={styles.addPhotoIcon}>+</Text>
              <Text style={styles.addPhotoText}>Add Photos</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={[styles.submitButton, loading && styles.submitDisabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.cream} /> : <Text style={styles.submitButtonText}>Add to Collection</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  const fabBottom = Math.max(insets.bottom, 20) + 4;

  return (
    <>
      <TouchableOpacity style={[styles.fab, { bottom: fabBottom }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setModalVisible(true); }}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Confetti Overlay */}
      {showConfetti && (
        <View style={styles.confettiContainer} pointerEvents="none">
          <ConfettiCannon
            count={150}
            origin={{ x: Dimensions.get('window').width / 2, y: -20 }}
            autoStart={true}
            fadeOut={true}
            fallSpeed={2500}
            explosionSpeed={350}
            colors={[COLORS.navy, COLORS.gold, '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']}
          />
        </View>
      )}
      
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={handleClose}><View style={styles.overlayTouchable} /></TouchableWithoutFeedback>
          <Animated.View style={[styles.modal, { transform: [{ translateY: Animated.add(Animated.add(slideAnim, translateY), modalOffsetAnim) }] }]}>
            <View {...panResponder.panHandlers} style={styles.modalHeader}><View style={styles.handle} /></View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>✕</Text></TouchableOpacity>
            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {step === 'type' && renderTypeSelection()}
              {step === 'sport-type' && renderSportTypeSelection()}
              {step === 'details' && renderDetails()}
              {step === 'photos' && renderPhotos()}
            </ScrollView>
          </Animated.View>
        </View>

        {showDatePicker && (
          <Modal visible={showDatePicker} transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
            <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
              <View style={styles.datePickerOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.datePickerModal}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={styles.datePickerCancel}>Cancel</Text></TouchableOpacity>
                      <TouchableOpacity onPress={confirmDateSelection}><Text style={styles.datePickerDone}>Done</Text></TouchableOpacity>
                    </View>
                    <DateTimePicker themeVariant="light" accentColor={COLORS.navy} value={eventDate} mode="date" display="inline" onChange={onDateChange} maximumDate={new Date()} style={styles.datePicker} />
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.navy, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 999 },
  fabIcon: { fontSize: 28, color: COLORS.cream, fontWeight: '300' },
  confettiContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  overlayTouchable: { flex: 1 },
  modal: { backgroundColor: COLORS.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '70%' },
  modalHeader: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  handle: { width: 40, height: 5, backgroundColor: COLORS.grayLight, borderRadius: 3 },
  closeBtn: { position: 'absolute', right: 20, top: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.creamDark, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  closeBtnText: { fontSize: 16, color: COLORS.gray },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  stepContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  backButton: { marginBottom: SPACING.md },
  backText: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.md, color: COLORS.navy },
  stepTitle: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.navy, marginBottom: SPACING.xs },
  stepSubtitle: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray, marginBottom: SPACING.xl },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  typeCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  typeEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  typeLabel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.lg, color: COLORS.navy, marginBottom: 4 },
  typeSubtitleText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.gray },
  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  sportCard: { width: '30%', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  sportEmoji: { fontSize: 32, marginBottom: SPACING.xs },
  sportLabel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.navy },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.navy, marginBottom: SPACING.sm },
  input: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy },
  dateButton: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateButtonText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy },
  dateButtonPlaceholder: { color: COLORS.grayLight },
  calendarIcon: { fontSize: 20 },
  nextButton: { backgroundColor: COLORS.navy, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  nextButtonText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.cream },
  photoHeader: { alignItems: 'center', marginBottom: SPACING.lg },
  photoEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  photoEventName: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xl, color: COLORS.navy, textAlign: 'center' },
  photoEventLocation: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray },
  photoPrompt: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray, textAlign: 'center', marginBottom: SPACING.lg },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  photoThumb: { width: '31%', aspectRatio: 1, borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  photoRemoveText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  addPhotoBtn: { width: '31%', aspectRatio: 1, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.creamDark, borderStyle: 'dashed' },
  addPhotoIcon: { fontSize: 32, color: COLORS.gray },
  addPhotoText: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.xs, color: COLORS.gray, marginTop: 4 },
  submitButton: { backgroundColor: COLORS.navy, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.xl },
  submitDisabled: { opacity: 0.7 },
  submitButtonText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.cream },
  datePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  datePickerModal: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, width: '90%' },
  datePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.sm, paddingBottom: SPACING.md },
  datePickerCancel: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray },
  datePickerDone: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.navy },
  datePicker: { backgroundColor: COLORS.white },
  teamContainer: { marginBottom: SPACING.lg },
  teamRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  teamColumn: { flex: 1 },
  teamLabel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.sm, color: COLORS.navy, marginBottom: SPACING.xs },
  teamInput: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.navy },
  vsText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.gray, marginHorizontal: SPACING.sm, marginTop: 32 },
  inputWithDropdown: { position: 'relative', zIndex: 10 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8, zIndex: 1000, maxHeight: 200 },
  dropdownScroll: { maxHeight: 200 },
  dropdownItem: { padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.creamDark },
  dropdownItemFirst: { borderTopWidth: 0 },
  dropdownItemText: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.sm, color: COLORS.navy },
});
