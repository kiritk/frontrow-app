import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Image,
  Dimensions, ScrollView, TextInput, Modal, Platform,
  KeyboardAvoidingView, Keyboard, Pressable,
  Animated, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import CalendarPicker from './CalendarPicker';

import { useAuth } from '../context/AuthContext';
import { editEvent } from '../lib/eventService';
import { SORTED_CITIES, USCity } from '../data/usCities';
import { COLORS, FONTS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../theme/colors';
import EventCard, { EventData } from './EventCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHELF_PADDING = SCREEN_WIDTH * 0.05;
const SLOT_GAP = 12;
const THUMB_SIZE = (SCREEN_WIDTH * 0.9 - SLOT_GAP * 4) / 5;
const SLOT_STRIDE = THUMB_SIZE + SLOT_GAP;
const MAX_PHOTOS = 5;

interface EventDetailViewProps {
  event: EventData;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: () => void;
  animValue?: Animated.Value;
}

export default function EventDetailView({ event, onClose, onDelete, onUpdate, animValue }: EventDetailViewProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>(event.photos || []);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [venue, setVenue] = useState(event.venue);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCityQuery, setEditCityQuery] = useState('');
  const [editShowCityDropdown, setEditShowCityDropdown] = useState(false);
  const [editDateObj, setEditDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const titleInputRef = useRef<TextInput>(null);
  const cityInputRef = useRef<TextInput>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const dragAnim = useRef(new Animated.ValueXY()).current;
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const dragIndexRef = useRef<number | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        dragIndexRef.current !== null && (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gesture) => {
        dragAnim.setValue({ x: gesture.dx, y: gesture.dy });
        const origin = dragIndexRef.current!;
        const target = Math.round(origin + gesture.dx / SLOT_STRIDE);
        const clamped = Math.max(0, Math.min(MAX_PHOTOS - 1, target));
        setDropTarget(clamped !== origin ? clamped : null);
      },
      onPanResponderRelease: (_, gesture) => {
        const origin = dragIndexRef.current!;
        const target = Math.round(origin + gesture.dx / SLOT_STRIDE);
        const clamped = Math.max(0, Math.min(MAX_PHOTOS - 1, target));

        if (clamped !== origin) {
          const currentPhotos = [...photosRef.current];
          const [moved] = currentPhotos.splice(origin, 1);
          currentPhotos.splice(clamped, 0, moved);
          setPhotos(currentPhotos);
          editEvent(event.id, { photos: currentPhotos }, user?.id).catch(console.error);
          onUpdate();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Animated.spring(dragAnim, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
        dragIndexRef.current = null;
        setDragIndex(null);
        setDropTarget(null);
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragAnim, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
        dragIndexRef.current = null;
        setDragIndex(null);
        setDropTarget(null);
      },
    })
  ).current;

  const currentEvent: EventData = { ...event, photos, title, date, venue };

  const updateEvent = async (updates: Record<string, any>) => {
    try {
      await editEvent(event.id, updates, user?.id);
      onUpdate();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const isTeamSport = (event.sport === 'nfl' || event.sport === 'mlb') && event.home_team && event.away_team;

  const openEditSheet = () => {
    setEditTitle(title);
    setEditCityQuery(venue);
    const parts = date.slice(0, 10).split('-');
    setEditDateObj(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    setEditShowCityDropdown(false);
    setShowDatePicker(false);
    setShowEditSheet(true);
    sheetAnim.setValue(0);
    Animated.timing(sheetAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeEditSheet = (onComplete?: () => void) => {
    Keyboard.dismiss();
    setShowDatePicker(false);
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowEditSheet(false);
      onComplete?.();
    });
  };

  const formatDisplayDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const formatDateForDB = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const hasChanges = (() => {
    if (!isTeamSport && editTitle !== title) return true;
    if (editCityQuery !== venue) return true;
    if (formatDateForDB(editDateObj) !== date.slice(0, 10)) return true;
    return false;
  })();

  const saveEdits = async () => {
    const updates: Record<string, any> = {};
    if (!isTeamSport && editTitle !== title) { updates.title = editTitle; setTitle(editTitle); }
    if (editCityQuery !== venue) { updates.venue = editCityQuery; setVenue(editCityQuery); }
    const newDateStr = formatDateForDB(editDateObj);
    if (newDateStr !== date.slice(0, 10)) { updates.date = newDateStr; setDate(newDateStr); }
    if (Object.keys(updates).length > 0) {
      await updateEvent(updates);
    }
    closeEditSheet();
  };

  const getFilteredCities = (query: string) => {
    if (!query) return SORTED_CITIES.slice(0, 5);
    return SORTED_CITIES.filter(city =>
      city.displayName.toLowerCase().includes(query.toLowerCase()) ||
      city.city.toLowerCase().includes(query.toLowerCase()) ||
      city.state.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  const selectEditCity = (city: USCity) => {
    setEditCityQuery(city.displayName);
    setEditShowCityDropdown(false);
    Keyboard.dismiss();
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `Maximum ${MAX_PHOTOS} photos per event`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newPhotos = [...photos, ...result.assets.map(a => a.uri)].slice(0, MAX_PHOTOS);
      setPhotos(newPhotos);
      await updateEvent({ photos: newPhotos });
    }
  };

  const removePhoto = async (index: number) => {
    Alert.alert('Remove Photo', 'Remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const newPhotos = photos.filter((_, i) => i !== index);
          setPhotos(newPhotos);
          await updateEvent({ photos: newPhotos });
        },
      },
    ]);
  };

  const startDrag = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dragIndexRef.current = index;
    setDragIndex(index);
    dragAnim.setValue({ x: 0, y: 0 });
  };

  const confirmDelete = () => {
    Alert.alert('Delete Event', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { onDelete(); onClose(); } },
    ]);
  };

  const containerAnimStyle = animValue ? {
    opacity: animValue,
    transform: [{
      translateY: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [40, 0],
      }),
    }],
  } : {};

  return (
    <Animated.View style={[styles.container, containerAnimStyle]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={dragIndex === null}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={22} color={COLORS.navy} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={openEditSheet}
            >
              <Text style={styles.editButtonText}>Edit</Text>
              <Ionicons name="pencil-outline" size={16} color={COLORS.navy} />
            </TouchableOpacity>
          </View>

          {/* Card */}
          <View style={styles.cardContainer}>
            <EventCard event={currentEvent} isFront={true} hideViewTicket={true} />
          </View>

          {/* Photo Shelf */}
          <View style={styles.photoSection} {...panResponder.panHandlers}>
            <Text style={styles.photoTitle}>Your Pictures</Text>
            <View style={styles.photoShelf}>
              {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
                const photo = photos[index];
                const isDragging = dragIndex === index;
                const isDropTarget = dropTarget === index && dragIndex !== index;

                if (photo) {
                  return (
                    <View key={index} style={styles.thumbWrapper}>
                      {isDragging ? (
                        <Animated.View
                          style={[
                            styles.photoThumb,
                            styles.photoThumbDragging,
                            { transform: [...dragAnim.getTranslateTransform(), { scale: 1.08 }], zIndex: 50 },
                          ]}
                        >
                          <Image source={{ uri: photo }} style={styles.photoThumbImage} />
                          {index === 0 && (
                            <View style={styles.coverBadge}>
                              <Text style={styles.coverBadgeText}>Cover</Text>
                            </View>
                          )}
                        </Animated.View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.photoThumb,
                            isDropTarget && styles.photoThumbDropTarget,
                          ]}
                          onLongPress={() => startDrag(index)}
                          delayLongPress={200}
                          activeOpacity={0.9}
                        >
                          <Image source={{ uri: photo }} style={styles.photoThumbImage} />
                          {index === 0 && (
                            <View style={styles.coverBadge}>
                              <Text style={styles.coverBadgeText}>Cover</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.deleteIcon}
                        onPress={() => removePhoto(index)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#E53935" />
                      </TouchableOpacity>
                    </View>
                  );
                }

                if (index === photos.length) {
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.photoThumb,
                        styles.addPhotoThumb,
                        isDropTarget && styles.photoThumbDropTarget,
                      ]}
                      onPress={pickImages}
                    >
                      <Ionicons name="add" size={28} color={COLORS.gray} />
                    </TouchableOpacity>
                  );
                }

                return (
                  <View
                    key={index}
                    style={[
                      styles.photoThumb,
                      styles.emptyPhotoThumb,
                      isDropTarget && styles.photoThumbDropTarget,
                    ]}
                  />
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit Sheet */}
      <Modal
        visible={showEditSheet}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeEditSheet()}
      >
          <Animated.View style={[styles.editSheetOverlay, { opacity: sheetAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeEditSheet()} />
          </Animated.View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.editSheetKAV}
            pointerEvents="box-none"
          >
          <Animated.View style={[styles.editSheetRoot, {
            transform: [{
              translateY: sheetAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [400, 0],
              }),
            }],
          }]}>
            <View style={styles.editSheetHandle} />
            <View style={styles.editSheetHeader}>
              <TouchableOpacity style={styles.editSheetCloseBtn} onPress={() => closeEditSheet()}>
                <Ionicons name="close" size={20} color={COLORS.navy} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.editSheetTrashBtn} onPress={() => closeEditSheet(confirmDelete)}>
                <Ionicons name="trash-outline" size={18} color="#E53935" />
              </TouchableOpacity>
            </View>

            <View style={styles.editSheetBodyContent}>
              {!isTeamSport && (
                <View style={styles.editFieldRow}>
                  <Ionicons name="star-outline" size={20} color={COLORS.navy} style={styles.editFieldIcon} />
                  <TextInput
                    ref={titleInputRef}
                    style={styles.editFieldInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Event title"
                    placeholderTextColor={COLORS.gray}
                  />
                  <TouchableOpacity onPress={() => titleInputRef.current?.focus()}>
                    <Ionicons name="pencil-outline" size={18} color={COLORS.gray} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.editFieldRow, { zIndex: 10 }]}>
                <Ionicons name="location-outline" size={20} color={COLORS.navy} style={styles.editFieldIcon} />
                <View style={{ flex: 1 }}>
                  <TextInput
                    ref={cityInputRef}
                    style={styles.editFieldInput}
                    value={editCityQuery}
                    onChangeText={(t) => {
                      setEditCityQuery(t);
                      setEditShowCityDropdown(true);
                    }}
                    onFocus={() => setEditShowCityDropdown(true)}
                    placeholder="Location"
                    placeholderTextColor={COLORS.gray}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      const filtered = getFilteredCities(editCityQuery);
                      if (filtered.length > 0) selectEditCity(filtered[0]);
                      else { setEditShowCityDropdown(false); Keyboard.dismiss(); }
                    }}
                  />
                  {editShowCityDropdown && getFilteredCities(editCityQuery).length > 0 && (
                    <View style={styles.editDropdown}>
                      <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled style={{ maxHeight: 200 }}>
                        {getFilteredCities(editCityQuery).map((city, index) => (
                          <TouchableOpacity
                            key={`${city.city}-${city.stateCode}`}
                            style={[styles.editDropdownItem, index === 0 && { borderTopWidth: 0 }]}
                            onPress={() => selectEditCity(city)}
                          >
                            <Text style={styles.editDropdownText}>{city.displayName}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => cityInputRef.current?.focus()}>
                  <Ionicons name="pencil-outline" size={18} color={COLORS.gray} />
                </TouchableOpacity>
              </View>

              <Pressable style={styles.editFieldRow} onPress={() => setShowDatePicker(!showDatePicker)}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.navy} style={styles.editFieldIcon} />
                <Text style={styles.editFieldText}>{formatDisplayDate(editDateObj)}</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)}>
                  <Ionicons name="pencil-outline" size={18} color={COLORS.gray} />
                </TouchableOpacity>
              </Pressable>

              {showDatePicker && (
                <CalendarPicker
                  selectedDate={editDateObj}
                  onDateChange={(d) => {
                    setEditDateObj(d);
                    setShowDatePicker(false);
                  }}
                />
              )}
            </View>

            <View style={styles.editSheetBottomBar}>
              <TouchableOpacity
                style={[styles.editSheetSaveBtn, !hasChanges && styles.editSheetSaveBtnDisabled]}
                onPress={saveEdits}
                disabled={!hasChanges}
              >
                <Text style={styles.editSheetSaveBtnText}>Edit Event</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          </KeyboardAvoidingView>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.cream,
    zIndex: 100,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  editButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
  cardContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  photoSection: {
    paddingHorizontal: SHELF_PADDING,
  },
  photoTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
  photoShelf: {
    flexDirection: 'row',
    gap: SLOT_GAP,
  },
  thumbWrapper: {
    position: 'relative',
  },
  photoThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  photoThumbImage: {
    width: '100%',
    height: '100%',
  },
  photoThumbDragging: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  photoThumbDropTarget: {
    borderWidth: 2,
    borderColor: COLORS.navy,
    borderStyle: 'dashed',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    color: COLORS.white,
  },
  deleteIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  addPhotoThumb: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  emptyPhotoThumb: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  editSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  editSheetKAV: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  editSheetRoot: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  editSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D1D6',
    alignSelf: 'center',
    marginTop: SPACING.sm,
  },
  editSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  editSheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  editSheetTrashBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  editSheetBodyContent: {
    paddingHorizontal: SPACING.lg,
  },
  editFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  editFieldIcon: {
    marginRight: SPACING.md,
  },
  editFieldInput: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
    flex: 1,
  },
  editFieldText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
    flex: 1,
  },
  editDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  editDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cream,
  },
  editDropdownText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  editCalendarContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  editSheetBottomBar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  editSheetSaveBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  editSheetSaveBtnDisabled: {
    opacity: 0.4,
  },
  editSheetSaveBtnText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
});
