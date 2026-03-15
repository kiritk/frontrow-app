import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

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
  };
  const handleClose = () => { setModalVisible(false); resetForm(); };

  const handleSelectType = (type: string) => { setEventType(type); setStep(type === 'sports' ? 'sport-type' : 'details'); };
  const handleSelectSportType = (type: string) => { setSportType(type); setStep('details'); };
  
  const handleDetailsNext = () => { 
    if (!eventName || !venue || !dateSelected) { 
      Alert.alert('Error', 'Please fill in all fields'); 
      return; 
    } 
    setStep('photos'); 
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setEventDate(selectedDate);
      setDateSelected(true);
    }
  };

  const onWebDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = e.target.value;
    if (dateString) {
      const [year, month, day] = dateString.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      setEventDate(newDate);
      setDateSelected(true);
    }
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

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow access to your photos'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 6 - photos.length, quality: 0.8 });
    if (!result.canceled) { setPhotos([...photos, ...result.assets.map(a => a.uri)].slice(0, 6)); }
  };

  const removePhoto = (index: number) => setPhotos(photos.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add events');
      return;
    }
    
    setLoading(true);
    
    try {
      const eventData = {
        user_id: user.id,
        title: eventName,
        type: eventType,
        sport: eventType === 'sports' ? sportType : null,
        venue: venue,
        venue_location: null,
        date: formatDateForDB(eventDate),
        photos: photos.length > 0 ? photos : [],
      };

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select();

      if (error) throw error;
      
      setModalVisible(false);
      resetForm();
      await onEventAdded();
      
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const getEventEmoji = () => eventType === 'sports' ? (SPORT_TYPES.find(s => s.value === sportType)?.emoji || '🏆') : (EVENT_TYPES.find(e => e.value === eventType)?.emoji || '🎫');

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

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webDateContainer}>
          <input
            type="date"
            value={dateSelected ? formatDateForInput(eventDate) : ''}
            max={formatDateForInput(new Date())}
            onChange={onWebDateChange as any}
            style={{
              width: '100%',
              padding: 16,
              fontSize: 16,
              fontFamily: 'Outfit, sans-serif',
              border: 'none',
              borderRadius: 12,
              backgroundColor: COLORS.white,
              color: COLORS.navy,
              cursor: 'pointer',
            }}
          />
        </View>
      );
    }

    return (
      <>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.dateButtonText, !dateSelected && styles.dateButtonPlaceholder]}>
            {dateSelected ? formatDisplayDate(eventDate) : 'Select a date'}
          </Text>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
        
        {showDatePicker && DateTimePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={eventDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
              themeVariant="light"
              style={styles.datePicker}
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.datePickerDoneButton} onPress={() => { setShowDatePicker(false); setDateSelected(true); }}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    );
  };

  const renderDetails = () => {
    const prompts = getPrompts();
    return (
      <View style={styles.stepContent}>
        <TouchableOpacity onPress={() => setStep(eventType === 'sports' ? 'sport-type' : 'type')} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepTitle}>The Details</Text>
        <Text style={styles.stepSubtitle}>Tell us about your experience</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{prompts.name}</Text>
          <TextInput style={styles.input} placeholder={prompts.placeholder} placeholderTextColor={COLORS.grayLight} value={eventName} onChangeText={setEventName} />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Where was it?</Text>
          <TextInput style={styles.input} placeholder="Venue, City" placeholderTextColor={COLORS.grayLight} value={venue} onChangeText={setVenue} />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>When was it?</Text>
          {renderDatePicker()}
        </View>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleDetailsNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPhotos = () => (
    <View style={styles.stepContent}>
      <TouchableOpacity onPress={() => setStep('details')} style={styles.backButton}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
      <View style={styles.photoHeader}>
        <Text style={styles.photoEmoji}>{getEventEmoji()}</Text>
        <Text style={styles.photoEventName}>{eventName}</Text>
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

  // Match the tab bar position exactly
  const fabBottom = Math.max(insets.bottom, 20);

  return (
    <>
      <TouchableOpacity style={[styles.fab, { bottom: fabBottom }]} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
            <View style={styles.modal}>
              <SafeAreaView edges={['bottom']} style={{flex: 1}}>
                <View style={styles.modalHeader}>
                  <View style={styles.handle} />
                  <TouchableOpacity onPress={handleClose} style={styles.closeBtn}><Text style={styles.closeBtnText}>✕</Text></TouchableOpacity>
                </View>
                <ScrollView style={{flex: 1}} contentContainerStyle={{paddingBottom: 40}} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  {step === 'type' && renderTypeSelection()}
                  {step === 'sport-type' && renderSportTypeSelection()}
                  {step === 'details' && renderDetails()}
                  {step === 'photos' && renderPhotos()}
                </ScrollView>
              </SafeAreaView>
            </View>
          </KeyboardAvoidingView>
        </View>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kav: { flex: 1, justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '70%' },
  modalHeader: { alignItems: 'center', paddingTop: SPACING.sm, paddingBottom: SPACING.md, position: 'relative' },
  handle: { width: 36, height: 4, backgroundColor: COLORS.grayLight, borderRadius: 2 },
  closeBtn: { position: 'absolute', right: SPACING.lg, top: SPACING.sm, width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.creamDark, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 16, color: COLORS.gray },
  stepContent: { paddingHorizontal: SPACING.lg },
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
  input: { fontFamily: FONTS.regular, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.navy },
  dateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
  dateButtonText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.navy },
  dateButtonPlaceholder: { color: COLORS.grayLight },
  calendarIcon: { fontSize: 20 },
  webDateContainer: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  datePickerContainer: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, marginTop: SPACING.sm, overflow: 'hidden' },
  datePicker: { height: 200, width: '100%' },
  datePickerDoneButton: { backgroundColor: COLORS.navy, paddingVertical: SPACING.sm, alignItems: 'center' },
  datePickerDoneText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.md, color: COLORS.cream },
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
});
