import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Platform, Alert, ActivityIndicator, Image, Animated,
  PanResponder, Dimensions, TouchableWithoutFeedback, Keyboard, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import ConfettiCannon from 'react-native-confetti-cannon';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { saveLocalEvent } from '../lib/localStorage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import { NFL_TEAMS, NFLTeam } from '../data/nflTeams';
import { MLB_TEAMS, MLBTeam } from '../data/mlbTeams';
import { SORTED_CITIES, USCity } from '../data/usCities';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { user, isGuest } = useAuth();
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

  const scrollViewRef = useRef<ScrollView>(null);
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

  const handleDatePress = () => {
    console.log('Date button pressed!');
    Keyboard.dismiss();
    setCityInputFocused(false);
    setShowCityDropdown(false);
    setShowHomeDropdown(false);
    setShowAwayDropdown(false);
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'dismissed') return;
    }
    if (selectedDate) { 
      setEventDate(selectedDate); 
      setDateSelected(true); 
    }
  };

  const confirmDateSelection = () => { 
    setDateSelected(true); 
    setShowDatePicker(false); 
  };
  
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
    setLoading(true);
    try {
      const isTeamSport = sportType === 'nfl' || sportType === 'mlb';
      const finalEventName = isTeamSport && homeTeam && awayTeam ? `${homeTeam.name} vs ${awayTeam.name}` : eventName;
      
      const eventData: any = {
        title: finalEventName,
        type: eventType,
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

      if (isGuest) {
        await saveLocalEvent(eventData);
      } else if (user) {
        const { error } = await supabase.from('events').insert([{ ...eventData, user_id: user.id }]).select();
        if (error) throw error;
      }
      
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
              <TextInput style={styles.teamInput} placeholder="Search teams.." placeholderTextColor={COLORS.grayLight} value={homeTeamQuery}
                onChangeText={(t) => { setHomeTeamQuery(t); setShowHomeDropdown(true); if (homeTeam && t !== homeTeam.fullName) setHomeTeam(null); }}
                onFocus={() => { setShowHomeDropdown(true); setShowAwayDropdown(false); }} />
              {renderTeamDropdown(homeFiltered, selectHomeTeam, showHomeDropdown)}
            </View>
          </View>
          <Text style={styles.vsText}>vs</Text>
          <View style={styles.teamColumn}>
            <Text style={styles.teamLabel}>Away Team</Text>
            <View style={styles.inputWithDropdown}>
              <TextInput style={styles.teamInput} placeholder="Search teams.." placeholderTextColor={COLORS.grayLight} value={awayTeamQuery}
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
        <TextInput style={styles.input} placeholder="Search cities..." placeholderTextColor={COLORS.grayLight} value={cityQuery}
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
          <TouchableOpacity key={type.value} style={styles.typeCardWrapper} onPress={() => handleSelectType(type.value)}>
            <View style={styles.typeCard}>
              <Text style={styles.typeEmoji}>{type.emoji}</Text>
              <Text style={styles.typeLabel}>{type.label}</Text>
              <Text style={styles.typeSubtitleText}>{type.subtitle}</Text>
            </View>
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
          <TouchableOpacity key={type.value} style={styles.sportCardWrapper} onPress={() => handleSelectSportType(type.value)}>
            <View style={styles.sportCard}>
              <Text style={styles.sportEmoji}>{type.emoji}</Text>
              <Text style={styles.sportLabel}>{type.label}</Text>
            </View>
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
      <View style={styles.stepContent}>
        <TouchableOpacity onPress={() => setStep(eventType === 'sports' ? 'sport-type' : 'type')} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepTitle}>The Details</Text>
        <Text style={styles.stepSubtitle}>Tell us about your experience</Text>
        
        {isTeamSport ? renderTeamSelection() : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{prompts.name}</Text>
            <TextInput 
              style={styles.input} 
              placeholder={prompts.placeholder} 
              placeholderTextColor={COLORS.grayLight} 
              value={eventName} 
              onChangeText={setEventName} 
              returnKeyType="next" 
              blurOnSubmit
              onFocus={() => { setShowCityDropdown(false); setCityInputFocused(false); }} 
            />
          </View>
        )}
        
        {isNonSportsEvent ? renderCitySelection() : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Where was it?</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Venue, City" 
              placeholderTextColor={COLORS.grayLight} 
              value={venue} 
              onChangeText={setVenue} 
              returnKeyType="done" 
              blurOnSubmit 
            />
          </View>
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>When was it?</Text>
          <Pressable style={styles.dateButton} onPress={handleDatePress}>
            <Text style={[styles.dateButtonText, !dateSelected && styles.dateButtonPlaceholder]}>
              {dateSelected ? formatDisplayDate(eventDate) : 'Select a date'}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </Pressable>
        </View>
        
        <Pressable style={styles.nextButton} onPress={handleDetailsNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </Pressable>
      </View>
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

      {showConfetti && (
        <ConfettiCannon count={150} origin={{ x: SCREEN_WIDTH / 2, y: -20 }} fadeOut explosionSpeed={400} fallSpeed={2500} colors={[COLORS.navy, '#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3']} autoStart />
      )}

      {/* Main Add Event Modal */}
      <Modal visible={modalVisible} animationType="none" transparent onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: Animated.add(slideAnim, Animated.add(translateY, modalOffsetAnim)) }] }]}>
            <View {...panResponder.panHandlers}><View style={styles.dragHandle} /></View>
            <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
              {step === 'type' && renderTypeSelection()}
              {step === 'sport-type' && renderSportTypeSelection()}
              {step === 'details' && renderDetails()}
              {step === 'photos' && renderPhotos()}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} animationType="fade" transparent onRequestClose={() => setShowDatePicker(false)}>
        <Pressable style={styles.datePickerOverlay} onPress={() => setShowDatePicker(false)}>
          <Pressable style={styles.datePickerModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.datePickerTitle}>Select Date</Text>
            <DateTimePicker 
              value={eventDate} 
              mode="date" 
              display="spinner"
              onChange={onDateChange} 
              maximumDate={new Date(2030, 11, 31)} 
              minimumDate={new Date(1950, 0, 1)} 
              themeVariant="light"
              style={styles.datePicker}
            />
            <Pressable style={styles.dateConfirmButton} onPress={confirmDateSelection}>
              <Text style={styles.dateConfirmText}>Confirm Date</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 100 },
  fabIcon: { color: COLORS.white, fontSize: 32, fontWeight: '300', marginTop: -2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' },
  scrollContent: { paddingBottom: 40 },
  dragHandle: { width: 40, height: 4, backgroundColor: COLORS.grayLight, borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 8 },
  stepContent: { padding: SPACING.lg, paddingTop: SPACING.md },
  stepTitle: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.navy, marginBottom: 4 },
  stepSubtitle: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray, marginBottom: SPACING.lg },
  backButton: { marginBottom: SPACING.md },
  backText: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.md, color: COLORS.navy },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  typeCardWrapper: { width: '50%', padding: 6 },
  typeCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center' },
  typeEmoji: { fontSize: 48, marginBottom: SPACING.md },
  typeLabel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.lg, color: COLORS.navy, marginBottom: SPACING.xs, textAlign: 'center' },
  typeSubtitleText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.gray, textAlign: 'center' },
  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  sportCardWrapper: { width: '33.33%', padding: 6 },
  sportCard: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  sportEmoji: { fontSize: 36, marginBottom: 6 },
  sportLabel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.sm, color: COLORS.navy },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.navy, marginBottom: SPACING.sm },
  input: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, paddingVertical: SPACING.lg, borderWidth: 1, borderColor: COLORS.grayLight },
  inputWithDropdown: { position: 'relative', zIndex: 10 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.grayLight, marginTop: 4, maxHeight: 200, zIndex: 1000, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  dropdownScroll: { maxHeight: 200 },
  dropdownItem: { padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.grayLight },
  dropdownItemFirst: { borderTopWidth: 0 },
  dropdownItemText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy },
  teamContainer: { marginBottom: SPACING.lg, zIndex: 20 },
  teamRow: { flexDirection: 'row', alignItems: 'flex-start' },
  teamColumn: { flex: 1 },
  teamLabel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.sm, color: COLORS.navy, marginBottom: SPACING.xs },
  teamInput: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, paddingVertical: SPACING.md, borderWidth: 1, borderColor: COLORS.grayLight },
  vsText: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg, color: COLORS.navy, marginHorizontal: SPACING.sm, marginTop: 28 },
  dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, paddingVertical: SPACING.lg, borderWidth: 1, borderColor: COLORS.grayLight },
  dateButtonText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy },
  dateButtonPlaceholder: { color: COLORS.grayLight },
  calendarIcon: { fontSize: 20 },
  datePickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  datePickerModal: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, width: '85%', alignItems: 'center' },
  datePickerTitle: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.lg, color: COLORS.navy, marginBottom: SPACING.md },
  datePicker: { height: 200, width: '100%' },
  dateConfirmButton: { backgroundColor: COLORS.navy, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md, width: '100%' },
  dateConfirmText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.white },
  nextButton: { backgroundColor: COLORS.navy, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, alignItems: 'center', marginTop: SPACING.lg },
  nextButtonText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.white },
  photoHeader: { alignItems: 'center', marginBottom: SPACING.lg },
  photoEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  photoEventName: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xl, color: COLORS.navy, textAlign: 'center' },
  photoEventLocation: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray },
  photoPrompt: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.gray, textAlign: 'center', marginBottom: SPACING.lg },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: SPACING.lg },
  photoThumb: { width: '33.33%', aspectRatio: 1, padding: 4 },
  photoImage: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.md },
  photoRemove: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  photoRemoveText: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  addPhotoBtn: { width: '33.33%', aspectRatio: 1, padding: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, borderWidth: 2, borderColor: COLORS.grayLight, borderStyle: 'dashed' },
  addPhotoIcon: { fontSize: 32, color: COLORS.navy },
  addPhotoText: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.xs, color: COLORS.navy, marginTop: 4 },
  submitButton: { backgroundColor: COLORS.navy, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  submitDisabled: { opacity: 0.6 },
  submitButtonText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.white },
});
