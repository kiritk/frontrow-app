import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Platform, Alert, ActivityIndicator, Image, Animated,
  PanResponder, Dimensions, TouchableWithoutFeedback, Keyboard, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [showHomeTeamPicker, setShowHomeTeamPicker] = useState(false);
  const [showAwayTeamPicker, setShowAwayTeamPicker] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

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
    setTeamSearchQuery('');
  };

  const handleClose = () => { 
    Keyboard.dismiss();
    setModalVisible(false); 
    resetForm(); 
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
    // For NFL, check teams instead of eventName
    if (sportType === 'nfl') {
      if (!homeTeam || !awayTeam || !venue || !dateSelected) { 
        Alert.alert('Error', 'Please fill in all fields'); 
        return; 
      }
      // Set eventName from teams
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

      // Add team data for NFL games
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

  const filteredTeams = NFL_TEAMS.filter(team => 
    team.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    team.city.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    team.fullName.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  const selectHomeTeam = (team: NFLTeam) => {
    setHomeTeam(team);
    setShowHomeTeamPicker(false);
    setTeamSearchQuery('');
  };

  const selectAwayTeam = (team: NFLTeam) => {
    setAwayTeam(team);
    setShowAwayTeamPicker(false);
    setTeamSearchQuery('');
  };

  const renderTeamPicker = (isHome: boolean) => {
    const selectedTeam = isHome ? homeTeam : awayTeam;
    const otherTeam = isHome ? awayTeam : homeTeam;
    const setShowPicker = isHome ? setShowHomeTeamPicker : setShowAwayTeamPicker;
    const selectTeam = isHome ? selectHomeTeam : selectAwayTeam;

    // Filter out the already selected team from the other picker
    const availableTeams = filteredTeams.filter(team => team.name !== otherTeam?.name);

    return (
      <Modal
        visible={isHome ? showHomeTeamPicker : showAwayTeamPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
          <View style={styles.teamPickerOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.teamPickerModal}>
                <Text style={styles.teamPickerTitle}>{isHome ? 'Home Team' : 'Away Team'}</Text>
                <TextInput
                  style={styles.teamSearchInput}
                  placeholder="Search teams..."
                  placeholderTextColor={COLORS.grayLight}
                  value={teamSearchQuery}
                  onChangeText={setTeamSearchQuery}
                  autoFocus
                />
                <FlatList
                  data={availableTeams}
                  keyExtractor={(item) => item.name}
                  style={styles.teamList}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.teamListItem}
                      onPress={() => selectTeam(item)}
                    >
                      <Image source={item.logo} style={styles.teamListLogo} />
                      <View style={styles.teamListInfo}>
                        <Text style={styles.teamListName}>{item.name}</Text>
                        <Text style={styles.teamListCity}>{item.city}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderNFLTeamSelection = () => (
    <View style={styles.nflTeamContainer}>
      <View style={styles.nflTeamRow}>
        {/* Home Team */}
        <View style={styles.nflTeamColumn}>
          <Text style={styles.nflTeamLabel}>Home Team</Text>
          <TouchableOpacity 
            style={styles.nflTeamButton}
            onPress={() => {
              Keyboard.dismiss();
              setShowHomeTeamPicker(true);
            }}
          >
            {homeTeam ? (
              <View style={styles.nflSelectedTeam}>
                <Image source={homeTeam.logo} style={styles.nflTeamLogo} />
                <Text style={styles.nflTeamName}>{homeTeam.name}</Text>
              </View>
            ) : (
              <Text style={styles.nflTeamPlaceholder}>Search teams..</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* VS */}
        <Text style={styles.nflVsText}>vs</Text>

        {/* Away Team */}
        <View style={styles.nflTeamColumn}>
          <Text style={styles.nflTeamLabel}>Away Team</Text>
          <TouchableOpacity 
            style={styles.nflTeamButton}
            onPress={() => {
              Keyboard.dismiss();
              setShowAwayTeamPicker(true);
            }}
          >
            {awayTeam ? (
              <View style={styles.nflSelectedTeam}>
                <Image source={awayTeam.logo} style={styles.nflTeamLogo} />
                <Text style={styles.nflTeamName}>{awayTeam.name}</Text>
              </View>
            ) : (
              <Text style={styles.nflTeamPlaceholder}>Search teams..</Text>
            )}
          </TouchableOpacity>
        </View>
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          
          <View style={styles.inputGroup}>
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
          
          <View style={styles.inputGroup}>
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
          
          <TouchableOpacity style={styles.nextButton} onPress={handleDetailsNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>

          {/* Team Picker Modals */}
          {renderTeamPicker(true)}
          {renderTeamPicker(false)}
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
      <TouchableOpacity style={[styles.fab, { bottom: fabBottom }]} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
      
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
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
              { transform: [{ translateY }] }
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

        {/* Date Picker Modal Overlay */}
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
  },
  nflTeamRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  nflTeamColumn: {
    flex: 1,
  },
  nflTeamLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  nflTeamButton: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    minHeight: 56,
    justifyContent: 'center',
  },
  nflSelectedTeam: {
    alignItems: 'center',
  },
  nflTeamLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  nflTeamName: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
  nflTeamPlaceholder: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.grayLight,
    textAlign: 'center',
  },
  nflVsText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },

  // Team Picker Modal styles
  teamPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamPickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: '90%',
    maxWidth: 360,
    maxHeight: '70%',
  },
  teamPickerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  teamSearchInput: {
    fontFamily: FONTS.regular,
    backgroundColor: COLORS.cream,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
  teamList: {
    flex: 1,
  },
  teamListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.creamDark,
  },
  teamListLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: SPACING.md,
  },
  teamListInfo: {
    flex: 1,
  },
  teamListName: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  teamListCity: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray,
  },
});
