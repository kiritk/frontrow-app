import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Platform, Alert, ActivityIndicator, Image, Animated,
  PanResponder, Dimensions, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';
import { NFL_TEAMS, NFLTeam } from '../data/nflTeams';

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
  { value: 'nba', label: 'NBA', emoji: '🏀' },
  { value: 'mlb', label: 'MLB', emoji: '⚾' },
  { value: 'soccer', label: 'Soccer', emoji: '⚽' },
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'other', label: 'Other', emoji: '🏅' },
];

type Step = 'type' | 'sport-type' | 'details' | 'photos';

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
  
  // NFL team selection state
  const [homeTeam, setHomeTeam] = useState<NFLTeam | null>(null);
  const [awayTeam, setAwayTeam] = useState<NFLTeam | null>(null);
  const [homeTeamQuery, setHomeTeamQuery] = useState('');
  const [awayTeamQuery, setAwayTeamQuery] = useState('');
  const [showHomeDropdown, setShowHomeDropdown] = useState(false);
  const [showAwayDropdown, setShowAwayDropdown] = useState(false);

  // Refs for text inputs
  const homeInputRef = useRef<TextInput>(null);
  const awayInputRef = useRef<TextInput>(null);

  // Slide up animation for modal
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Pan responder for swipe to dismiss
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            handleClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Animate modal slide up when opened
  useEffect(() => {
    if (modalVisible) {
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    }
  }, [modalVisible]);

  const resetForm = () => { 
    setStep('type'); 
    setEventType(''); 
    setSportType(''); 
    setEventName(''); 
    setVenue(''); 
    setEventDate(new Date()); 
    setDateSelected(false);
    setShowDatePicker(false);
    setPhotos([]);
    setHomeTeam(null);
    setAwayTeam(null);
    setHomeTeamQuery('');
    setAwayTeamQuery('');
    setShowHomeDropdown(false);
    setShowAwayDropdown(false);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      resetForm();
    });
  };

  const handleSelectType = (type: string) => { 
    setEventType(type); 
    setStep(type === 'sports' ? 'sport-type' : 'details'); 
  };
  
  const handleSelectSportType = (type: string) => { 
    setSportType(type); 
    setStep('details'); 
  };
  
  const handleDetailsNext = () => { 
    if (sportType === 'nfl') {
      if (!homeTeam || !awayTeam || !venue || !dateSelected) { 
        Alert.alert('Error', 'Please fill in all fields'); 
        return; 
      }
      setEventName(`${homeTeam.name} vs ${awayTeam.name}`);
    } else {
      if (!eventName || !venue || !dateSelected) { 
        Alert.alert('Error', 'Please fill in all fields'); 
        return; 
      }
    }
    setStep('photos'); 
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      setEventDate(selectedDate);
      setDateSelected(true);
    }
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  };

  const confirmDateSelection = () => {
    setDateSelected(true);
    setShowDatePicker(false);
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateForDB = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { 
      Alert.alert('Permission needed', 'Please allow access to your photos'); 
      return; 
    }
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsMultipleSelection: true, 
      selectionLimit: 6 - photos.length, 
      quality: 0.8 
    });
    if (!result.canceled) { 
      setPhotos([...photos, ...result.assets.map(a => a.uri)].slice(0, 6)); 
    }
  };

  const removePhoto = (index: number) => setPhotos(photos.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add events');
      return;
    }
    
    setLoading(true);
    
    try {
      const finalEventName = sportType === 'nfl' && homeTeam && awayTeam 
        ? `${homeTeam.name} vs ${awayTeam.name}`
        : eventName;

      const eventData: any = {
        user_id: user.id,
        title: finalEventName,
        type: eventType,
        sport: eventType === 'sports' ? sportType : null,
        venue: venue,
        venue_location: null,
        date: formatDateForDB(eventDate),
        photos: photos.length > 0 ? photos : [],
      };

      if (sportType === 'nfl' && homeTeam && awayTeam) {
        eventData.home_team = { name: homeTeam.name, city: homeTeam.city, fullName: homeTeam.fullName };
        eventData.away_team = { name: awayTeam.name, city: awayTeam.city, fullName: awayTeam.fullName };
      }

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select();

      if (error) throw error;
      
      handleClose();
      await onEventAdded();
      
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const getEventEmoji = () => eventType === 'sports' 
    ? (SPORT_TYPES.find(s => s.value === sportType)?.emoji || '🏆') 
    : (EVENT_TYPES.find(e => e.value === eventType)?.emoji || '🎫');

  const getPrompts = () => {
    switch (eventType) {
      case 'concert': return { name: 'Who did you see?', placeholder: 'Taylor Swift, The Weeknd...' };
      case 'sports': return { name: 'Who played?', placeholder: '49ers vs Chiefs...' };
      case 'theater': return { name: 'What was the show?', placeholder: 'Hamilton, Wicked...' };
      case 'comedy': return { name: 'Who was the comedian?', placeholder: 'Dave Chappelle...' };
      case 'landmark': return { name: 'What was the landmark?', placeholder: 'Eiffel Tower...' };
      default: return { name: 'What was the experience?', placeholder: 'Describe...' };
    }
  };

  // Sort teams alphabetically by full name
  const sortedTeams = [...NFL_TEAMS].sort((a, b) => a.fullName.localeCompare(b.fullName));

  const getFilteredTeams = (query: string, excludeTeam: NFLTeam | null) => {
    return sortedTeams.filter(team => {
      if (excludeTeam && team.name === excludeTeam.name) return false;
      if (!query) return true;
      return (
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        team.city.toLowerCase().includes(query.toLowerCase()) ||
        team.fullName.toLowerCase().includes(query.toLowerCase())
      );
    });
  };

  const selectHomeTeam = (team: NFLTeam) => {
    setHomeTeam(team);
    setHomeTeamQuery(team.fullName);
    setShowHomeDropdown(false);
    // Auto-fill venue with stadium
    setVenue(team.stadium);
    // Dismiss keyboard
    Keyboard.dismiss();
    homeInputRef.current?.blur();
  };

  const selectAwayTeam = (team: NFLTeam) => {
    setAwayTeam(team);
    setAwayTeamQuery(team.fullName);
    setShowAwayDropdown(false);
    // Dismiss keyboard
    Keyboard.dismiss();
    awayInputRef.current?.blur();
  };

  const renderTeamDropdown = (
    teams: NFLTeam[], 
    onSelect: (team: NFLTeam) => void,
    show: boolean
  ) => {
    if (!show || teams.length === 0) return null;
    
    return (
      <View style={styles.dropdown}>
        <ScrollView 
          style={styles.dropdownScroll} 
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {teams.slice(0, 5).map((team, index) => (
            <TouchableOpacity 
              key={team.name}
              style={[
                styles.dropdownItem,
                index === 0 && styles.dropdownItemFirst
              ]}
              onPress={() => onSelect(team)}
            >
              <Text style={styles.dropdownItemText}>{team.fullName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderNFLTeamSelection = () => {
    const homeFilteredTeams = getFilteredTeams(homeTeamQuery, awayTeam);
    const awayFilteredTeams = getFilteredTeams(awayTeamQuery, homeTeam);

    return (
      <View style={styles.nflTeamContainer}>
        <View style={styles.nflTeamRow}>
          {/* Home Team */}
          <View style={styles.nflTeamColumn}>
            <Text style={styles.nflTeamLabel}>Home Team</Text>
            <View style={styles.inputWithDropdown}>
              <TextInput
                style={styles.nflTeamInput}
                placeholder="Search teams.."
                placeholderTextColor={COLORS.grayLight}
                value={homeTeamQuery}
                onChangeText={(text) => {
                  setHomeTeamQuery(text);
                  setShowHomeDropdown(true);
                  if (homeTeam && text !== homeTeam.fullName) {
                    setHomeTeam(null);
                  }
                }}
                onFocus={() => setShowHomeDropdown(true)}
                onBlur={() => {
                  // Delay to allow tap on dropdown item
                  setTimeout(() => setShowHomeDropdown(false), 200);
                }}
              />
              {renderTeamDropdown(homeFilteredTeams, selectHomeTeam, showHomeDropdown)}
            </View>
          </View>

          {/* VS */}
          <Text style={styles.nflVsText}>vs</Text>

          {/* Away Team */}
          <View style={styles.nflTeamColumn}>
            <Text style={styles.nflTeamLabel}>Away Team</Text>
            <View style={styles.inputWithDropdown}>
              <TextInput
                style={styles.nflTeamInput}
                placeholder="Search teams.."
                placeholderTextColor={COLORS.grayLight}
                value={awayTeamQuery}
                onChangeText={(text) => {
                  setAwayTeamQuery(text);
                  setShowAwayDropdown(true);
                  if (awayTeam && text !== awayTeam.fullName) {
                    setAwayTeam(null);
                  }
                }}
                onFocus={() => setShowAwayDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowAwayDropdown(false), 200);
                }}
              />
              {renderTeamDropdown(awayFilteredTeams, selectAwayTeam, showAwayDropdown)}
            </View>
          </View>
        </View>
      </View>
    );
  };

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
      <TouchableOpacity onPress={() => setStep('type')} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
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
    const isNFL = sportType === 'nfl';

    return (
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss();
        setShowHomeDropdown(false);
        setShowAwayDropdown(false);
      }}>
        <View style={styles.stepContent}>
          <TouchableOpacity onPress={() => setStep(eventType === 'sports' ? 'sport-type' : 'type')} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.stepTitle}>The Details</Text>
          <Text style={styles.stepSubtitle}>Tell us about your experience</Text>
          
          {isNFL ? (
            renderNFLTeamSelection()
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{prompts.name}</Text>
              <TextInput 
                style={styles.input} 
                placeholder={prompts.placeholder} 
                placeholderTextColor={COLORS.grayLight} 
                value={eventName} 
                onChangeText={setEventName}
                returnKeyType="next"
                blurOnSubmit={true}
              />
            </View>
          )}
          
          <View style={[styles.inputGroup, isNFL && { zIndex: -1 }]}>
            <Text style={styles.label}>Where was it?</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Venue, City" 
              placeholderTextColor={COLORS.grayLight} 
              value={venue} 
              onChangeText={setVenue}
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </View>
          
          <View style={[styles.inputGroup, isNFL && { zIndex: -1 }]}>
            <Text style={styles.label}>When was it?</Text>
            <TouchableOpacity 
              style={styles.dateButton} 
              onPress={() => {
                Keyboard.dismiss();
                setShowDatePicker(true);
              }}
            >
              <Text style={[styles.dateButtonText, !dateSelected && styles.dateButtonPlaceholder]}>
                {dateSelected ? formatDisplayDate(eventDate) : 'Select a date'}
              </Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={[styles.nextButton, isNFL && { zIndex: -1 }]} onPress={handleDetailsNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const renderPhotos = () => {
    const displayTitle = sportType === 'nfl' && homeTeam && awayTeam 
      ? `${homeTeam.name} vs ${awayTeam.name}`
      : eventName;

    return (
      <View style={styles.stepContent}>
        <TouchableOpacity onPress={() => setStep('details')} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.photoHeader}>
          <Text style={styles.photoEmoji}>{getEventEmoji()}</Text>
          <Text style={styles.photoEventName}>{displayTitle}</Text>
          <Text style={styles.photoEventLocation}>{venue}</Text>
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

  const fabBottom = Math.max(insets.bottom, 20);

  return (
    <>
      <TouchableOpacity style={[styles.fab, { bottom: fabBottom }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setModalVisible(true); }}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
      
      <Modal 
        visible={modalVisible} 
        animationType="fade" 
        transparent 
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={handleClose}>
            <View style={styles.overlayTouchable} />
          </TouchableWithoutFeedback>
          
          <Animated.View 
            style={[
              styles.modal, 
              { transform: [{ translateY: Animated.add(slideAnim, translateY) }] }
            ]}
          >
            <View {...panResponder.panHandlers} style={styles.modalHeader}>
              <View style={styles.handle} />
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            
            <ScrollView 
              style={styles.scrollView} 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled" 
              showsVerticalScrollIndicator={false}
            >
              {step === 'type' && renderTypeSelection()}
              {step === 'sport-type' && renderSportTypeSelection()}
              {step === 'details' && renderDetails()}
              {step === 'photos' && renderPhotos()}
            </ScrollView>
          </Animated.View>
        </View>

        {showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
              <View style={styles.datePickerOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.datePickerModal}>
                    <View style={styles.datePickerHeader}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerCancel}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={confirmDateSelection}>
                        <Text style={styles.datePickerDone}>Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      themeVariant="light"
                      accentColor={COLORS.navy}
                      value={eventDate}
                      mode="date"
                      display="inline"
                      onChange={onDateChange}
                      maximumDate={new Date()}
                      style={styles.datePicker}
                    />
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
  fab: { 
    position: 'absolute', 
    right: 20,
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: COLORS.navy, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: COLORS.navy, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 8,
    zIndex: 999,
  },
  fabIcon: { fontSize: 32, color: COLORS.cream, fontWeight: '300' },
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modal: { 
    backgroundColor: COLORS.cream, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: '92%', 
    minHeight: '70%',
  },
  modalHeader: { 
    alignItems: 'center', 
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: { 
    width: 40, 
    height: 5, 
    backgroundColor: COLORS.grayLight, 
    borderRadius: 3,
  },
  closeBtn: { 
    position: 'absolute', 
    right: 20, 
    top: 12, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: COLORS.creamDark, 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 10,
  },
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
  typeLabel: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.lg, color: COLORS.navy, marginBottom: 2 },
  typeSubtitleText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.xs, color: COLORS.gray },
  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  sportCard: { width: '30%', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, alignItems: 'center' },
  sportEmoji: { fontSize: 36, marginBottom: SPACING.xs },
  sportLabel: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.md, color: COLORS.navy },
  inputGroup: { marginBottom: SPACING.lg },
  label: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.md, color: COLORS.navy, marginBottom: SPACING.sm },
  input: { 
    fontFamily: FONTS.regular, 
    backgroundColor: COLORS.white, 
    borderRadius: BORDER_RADIUS.lg, 
    padding: SPACING.md, 
    fontSize: FONT_SIZES.md, 
    color: COLORS.navy,
  },
  dateButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: COLORS.white, 
    borderRadius: BORDER_RADIUS.lg, 
    padding: SPACING.md,
  },
  dateButtonText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy },
  dateButtonPlaceholder: { color: COLORS.grayLight },
  calendarIcon: { fontSize: 20 },
  nextButton: { backgroundColor: COLORS.navy, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  nextButtonText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.lg, color: COLORS.cream },
  photoHeader: { alignItems: 'center', marginBottom: SPACING.xl },
  photoEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  photoEventName: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xl, color: COLORS.navy, textAlign: 'center' },
  photoEventLocation: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray, marginTop: SPACING.xs },
  photoPrompt: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.gray, textAlign: 'center', marginBottom: SPACING.lg },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xl },
  photoThumb: { width: '31%', aspectRatio: 1, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  photoRemoveText: { color: COLORS.white, fontSize: 12 },
  addPhotoBtn: { width: '31%', aspectRatio: 1, borderRadius: BORDER_RADIUS.lg, borderWidth: 2, borderColor: COLORS.grayLight, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  addPhotoIcon: { fontSize: 32, color: COLORS.grayLight },
  addPhotoText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.xs, color: COLORS.gray, marginTop: 4 },
  submitButton: { backgroundColor: COLORS.navy, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitButtonText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.lg, color: COLORS.cream },
  
  // Date Picker Modal styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 360,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  datePickerCancel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
  },
  datePickerDone: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  datePicker: {
    height: 320,
  },

  // NFL Team Selection styles
  nflTeamContainer: {
    marginBottom: SPACING.lg,
    zIndex: 10,
  },
  nflTeamRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  nflTeamColumn: {
    flex: 1,
    zIndex: 10,
  },
  nflTeamLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  inputWithDropdown: {
    position: 'relative',
    zIndex: 10,
  },
  nflTeamInput: {
    fontFamily: FONTS.regular,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
    textAlign: 'center',
  },
  nflVsText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginHorizontal: SPACING.sm,
    marginTop: 42,
  },

  // Dropdown styles
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.creamDark,
  },
  dropdownItemFirst: {
    backgroundColor: COLORS.cream,
  },
  dropdownItemText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
});
