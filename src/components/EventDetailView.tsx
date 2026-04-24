import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Image,
  Dimensions, ScrollView, TextInput, Modal, Platform,
  KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Pressable,
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
}

export default function EventDetailView({ event, onClose, onDelete, onUpdate }: EventDetailViewProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<string[]>(event.photos || []);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [venue, setVenue] = useState(event.venue);
  const [showEditModal, setShowEditModal] = useState<'title' | 'date' | 'location' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [cityQuery, setCityQuery] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);

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

  const openEditModal = (field: 'title' | 'date' | 'location') => {
    if (field === 'title') setEditValue(title);
    else if (field === 'date') setEditDate(new Date(date));
    else { setCityQuery(venue); setShowCityDropdown(false); }
    setShowEditModal(field);
  };

  const closeEditModal = () => setShowEditModal(null);

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

  return (
    <View style={styles.container}>
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
              onPress={() => setShowEditMenu(!showEditMenu)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
              <Ionicons name="pencil-outline" size={16} color={COLORS.navy} />
            </TouchableOpacity>
          </View>

          {showEditMenu && (
            <View style={styles.editMenu}>
              <TouchableOpacity style={styles.editMenuItem} onPress={() => { setShowEditMenu(false); openEditModal('title'); }}>
                <Ionicons name="text-outline" size={18} color={COLORS.navy} />
                <Text style={styles.editMenuText}>Edit Title</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editMenuItem} onPress={() => { setShowEditMenu(false); openEditModal('date'); }}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.navy} />
                <Text style={styles.editMenuText}>Edit Date</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.editMenuItem} onPress={() => { setShowEditMenu(false); openEditModal('location'); }}>
                <Ionicons name="location-outline" size={18} color={COLORS.navy} />
                <Text style={styles.editMenuText}>Edit Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editMenuItem, styles.editMenuDeleteItem]} onPress={confirmDelete}>
                <Ionicons name="trash-outline" size={18} color="#E53935" />
                <Text style={[styles.editMenuText, { color: '#E53935' }]}>Delete Event</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Card */}
          <View style={styles.cardContainer}>
            <EventCard event={currentEvent} />
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

      {/* Edit Title Modal */}
      <Modal visible={showEditModal === 'title'} transparent animationType="fade" onRequestClose={closeEditModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={closeEditModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Edit Title</Text>
                  <TextInput
                    style={[styles.modalInput, { marginBottom: SPACING.lg }]}
                    value={editValue}
                    onChangeText={setEditValue}
                    autoFocus
                    placeholder="Enter title"
                    placeholderTextColor={COLORS.gray}
                    returnKeyType="done"
                    onSubmitEditing={saveTitle}
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={closeEditModal}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={saveTitle}>
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Date Modal */}
      <Modal visible={showEditModal === 'date'} transparent animationType="fade" onRequestClose={closeEditModal}>
        <TouchableWithoutFeedback onPress={closeEditModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Edit Date</Text>
                <CalendarPicker
                  selectedDate={editDate}
                  onDateChange={(d) => saveDate(d)}
                  maximumDate={new Date(2030, 11, 31)}
                  minimumDate={new Date(1950, 0, 1)}
                />
                <Pressable style={styles.saveButton} onPress={closeEditModal}>
                  <Text style={styles.saveText}>Done</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Location Modal */}
      <Modal visible={showEditModal === 'location'} transparent animationType="fade" onRequestClose={closeEditModal}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={closeEditModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Edit Location</Text>
                  <View style={styles.locationInputWrapper}>
                    <TextInput
                      style={styles.modalInput}
                      value={cityQuery}
                      onChangeText={(t) => { setCityQuery(t); setShowCityDropdown(true); }}
                      autoFocus
                      placeholder="Search cities..."
                      placeholderTextColor={COLORS.gray}
                      onFocus={() => setShowCityDropdown(true)}
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        const filtered = getFilteredCities(cityQuery);
                        if (filtered.length > 0) selectCity(filtered[0]);
                      }}
                    />
                    {showCityDropdown && getFilteredCities(cityQuery).length > 0 && (
                      <View style={styles.cityDropdown}>
                        <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled style={{ maxHeight: 200 }}>
                          {getFilteredCities(cityQuery).map((city, index) => (
                            <TouchableOpacity
                              key={`${city.city}-${city.stateCode}`}
                              style={[styles.cityDropdownItem, index === 0 && { borderTopWidth: 0 }]}
                              onPress={() => selectCity(city)}
                            >
                              <Text style={styles.cityDropdownText}>{city.displayName}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={closeEditModal}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  editMenu: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  editMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cream,
  },
  editMenuDeleteItem: {
    borderBottomWidth: 0,
  },
  editMenuText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: SCREEN_WIDTH - 64,
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
    marginBottom: SPACING.md,
  },
  modalInput: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
    borderWidth: 1,
    borderColor: COLORS.cream,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cream,
  },
  cancelText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
  saveButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.navy,
  },
  saveText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.white,
    textAlign: 'center',
  },
  locationInputWrapper: {
    position: 'relative',
    zIndex: 10,
    marginBottom: SPACING.lg,
  },
  cityDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.cream,
    borderRadius: BORDER_RADIUS.md,
    marginTop: 4,
    overflow: 'hidden',
  },
  cityDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.cream,
  },
  cityDropdownText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
});
