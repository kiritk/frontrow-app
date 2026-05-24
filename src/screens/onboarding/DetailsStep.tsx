import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Pressable,
  Platform,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../../theme/colors';
import { NFL_TEAMS, NFLTeam } from '../../data/nflTeams';
import { MLB_TEAMS, MLBTeam } from '../../data/mlbTeams';
import { searchCities, City } from '../../lib/geonames';
import { EventTypeValue } from './EventTypeStep';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BG_FADE = '#FBFCFC';

export type SportTypeValue = 'nfl' | 'mlb' | 'nba' | 'soccer' | 'tennis' | 'other';
export type SportTeam = NFLTeam | MLBTeam;

const SPORT_TYPES: { value: SportTypeValue; label: string }[] = [
  { value: 'nfl', label: 'NFL' },
  { value: 'mlb', label: 'MLB' },
  { value: 'nba', label: 'NBA' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'other', label: 'Other' },
];

export interface DetailsData {
  sportType: SportTypeValue | null;
  homeTeam: SportTeam | null;
  awayTeam: SportTeam | null;
  eventName: string;
  venue: string;
  selectedCity: City | null;
  eventDate: Date | null;
}

interface DetailsStepProps {
  eventType: EventTypeValue;
  value: DetailsData;
  onChange: (data: DetailsData) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function DetailsStep({
  eventType,
  value,
  onChange,
  onContinue,
  onBack,
}: DetailsStepProps) {
  const insets = useSafeAreaInsets();
  const [sportOpen, setSportOpen] = useState(false);
  const [homeQuery, setHomeQuery] = useState(value.homeTeam?.fullName ?? '');
  const [awayQuery, setAwayQuery] = useState(value.awayTeam?.fullName ?? '');
  const [showHomeDropdown, setShowHomeDropdown] = useState(false);
  const [showAwayDropdown, setShowAwayDropdown] = useState(false);
  const [cityQuery, setCityQuery] = useState(value.selectedCity?.displayName ?? value.venue ?? '');
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isSports = eventType === 'sports';
  const isTeamSport = isSports && (value.sportType === 'nfl' || value.sportType === 'mlb');

  const patch = (partial: Partial<DetailsData>) => onChange({ ...value, ...partial });

  const canContinue = (() => {
    if (isSports) {
      if (!value.sportType) return false;
      if (isTeamSport) {
        if (!value.homeTeam || !value.awayTeam) return false;
      } else {
        if (!value.eventName.trim()) return false;
      }
    } else {
      if (!value.eventName.trim()) return false;
    }
    if (!value.selectedCity && !value.venue.trim()) return false;
    if (!value.eventDate) return false;
    return true;
  })();

  const handleSelectSport = (sport: SportTypeValue) => {
    setSportOpen(false);
    if (sport === value.sportType) return;
    patch({
      sportType: sport,
      homeTeam: null,
      awayTeam: null,
      eventName: '',
      venue: '',
    });
    setHomeQuery('');
    setAwayQuery('');
  };

  const teamsList: SportTeam[] =
    value.sportType === 'nfl' ? NFL_TEAMS : value.sportType === 'mlb' ? MLB_TEAMS : [];
  const sortedTeams = [...teamsList].sort((a, b) => a.fullName.localeCompare(b.fullName));
  const filterTeams = (query: string, exclude: SportTeam | null) =>
    sortedTeams.filter((t) => {
      if (exclude && t.name === exclude.name) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.fullName.toLowerCase().includes(q)
      );
    });

  const selectHome = (team: SportTeam) => {
    setHomeQuery(team.fullName);
    setShowHomeDropdown(false);
    const next: Partial<DetailsData> = { homeTeam: team, venue: team.stadium };
    if (value.awayTeam) next.eventName = `${team.name} vs ${value.awayTeam.name}`;
    patch(next);
    Keyboard.dismiss();
  };
  const selectAway = (team: SportTeam) => {
    setAwayQuery(team.fullName);
    setShowAwayDropdown(false);
    const next: Partial<DetailsData> = { awayTeam: team };
    if (value.homeTeam) next.eventName = `${value.homeTeam.name} vs ${team.name}`;
    patch(next);
    Keyboard.dismiss();
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCitySearch = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setCityResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchCities(query);
      setCityResults(results);
    }, 300);
  }, []);

  const selectCity = (city: City) => {
    setCityQuery(city.displayName);
    setShowCityDropdown(false);
    setCityResults([]);
    patch({ selectedCity: city, venue: city.displayName });
    Keyboard.dismiss();
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const namePlaceholder = (() => {
    switch (eventType) {
      case 'concert':
        return 'Who did you see?';
      case 'theater':
        return 'What was the show?';
      case 'comedy':
        return 'Who was the comedian?';
      case 'landmark':
        return 'What was the landmark?';
      case 'sports':
        return 'Team vs Team, event name...';
      default:
        return 'What was the experience?';
    }
  })();

  const sportLabel = value.sportType
    ? SPORT_TYPES.find((s) => s.value === value.sportType)?.label
    : null;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../../../assets/images/splash_screen_bg.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(251,252,252,0)', 'rgba(251,252,252,0)', BG_FADE]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={16} color={COLORS.black} />
              <Text style={styles.backText}>BACK</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Let's add a few more details.</Text>
          <Text style={styles.subtitle}>
            Help us specify the details of this live experience.
          </Text>

          <View style={styles.fieldsList}>
            {isSports && (
              <View>
                <Pressable
                  style={styles.fieldCard}
                  onPress={() => setSportOpen((o) => !o)}
                >
                  <Text style={styles.fieldLabel}>SPORT TYPE</Text>
                  <View style={styles.fieldValueRow}>
                    <Text
                      style={[
                        styles.fieldValue,
                        !sportLabel && styles.fieldValuePlaceholder,
                      ]}
                    >
                      {sportLabel ?? 'Select a sport'}
                    </Text>
                    <Ionicons
                      name={sportOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={COLORS.black}
                    />
                  </View>
                </Pressable>
                {sportOpen && (
                  <View style={styles.dropdownPanel}>
                    {SPORT_TYPES.map((s, i) => (
                      <TouchableOpacity
                        key={s.value}
                        style={[
                          styles.dropdownOption,
                          i !== 0 && styles.dropdownOptionBordered,
                        ]}
                        onPress={() => handleSelectSport(s.value)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.dropdownOptionText}>{s.label}</Text>
                        {value.sportType === s.value && (
                          <Ionicons name="checkmark" size={16} color={COLORS.black} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {isTeamSport && (
              <>
                <View style={[styles.fieldCard, { zIndex: 20 }]}>
                  <Text style={styles.fieldLabel}>HOME TEAM</Text>
                  <View style={styles.inputWithDropdown}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="Search teams..."
                      placeholderTextColor={COLORS.grayLight}
                      value={homeQuery}
                      onChangeText={(t) => {
                        setHomeQuery(t);
                        setShowHomeDropdown(true);
                        if (value.homeTeam && t !== value.homeTeam.fullName) {
                          patch({ homeTeam: null, venue: '', eventName: '' });
                        }
                      }}
                      onFocus={() => {
                        setShowHomeDropdown(true);
                        setShowAwayDropdown(false);
                      }}
                    />
                    {showHomeDropdown && (
                      <TeamDropdown
                        teams={filterTeams(homeQuery, value.awayTeam)}
                        onSelect={selectHome}
                      />
                    )}
                  </View>
                </View>

                <View style={[styles.fieldCard, { zIndex: 10 }]}>
                  <Text style={styles.fieldLabel}>AWAY TEAM</Text>
                  <View style={styles.inputWithDropdown}>
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="Search teams..."
                      placeholderTextColor={COLORS.grayLight}
                      value={awayQuery}
                      onChangeText={(t) => {
                        setAwayQuery(t);
                        setShowAwayDropdown(true);
                        if (value.awayTeam && t !== value.awayTeam.fullName) {
                          patch({ awayTeam: null, eventName: '' });
                        }
                      }}
                      onFocus={() => {
                        setShowAwayDropdown(true);
                        setShowHomeDropdown(false);
                      }}
                    />
                    {showAwayDropdown && (
                      <TeamDropdown
                        teams={filterTeams(awayQuery, value.homeTeam)}
                        onSelect={selectAway}
                      />
                    )}
                  </View>
                </View>
              </>
            )}

            {!isTeamSport && (
              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>EVENT NAME</Text>
                <TextInput
                  style={styles.inlineInput}
                  placeholder={namePlaceholder}
                  placeholderTextColor={COLORS.grayLight}
                  value={value.eventName}
                  onChangeText={(t) => patch({ eventName: t })}
                />
              </View>
            )}

            <View style={[styles.fieldCard, { zIndex: 5 }]}>
              <Text style={styles.fieldLabel}>VENUE LOCATION</Text>
              {isTeamSport && value.venue ? (
                <Text style={styles.fieldValue}>{value.venue}</Text>
              ) : (
                <View style={styles.inputWithDropdown}>
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="e.g. Madison Square Garden"
                    placeholderTextColor={COLORS.grayLight}
                    value={cityQuery}
                    onChangeText={(t) => {
                      setCityQuery(t);
                      setShowCityDropdown(true);
                      handleCitySearch(t);
                      patch({
                        venue: t,
                        selectedCity:
                          value.selectedCity && t !== value.selectedCity.displayName
                            ? null
                            : value.selectedCity,
                      });
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                  />
                  {showCityDropdown && cityResults.length > 0 && (
                    <View style={styles.dropdownAbsolute}>
                      {cityResults.map((c, i) => (
                        <TouchableOpacity
                          key={`${c.city}-${c.latitude}-${c.longitude}`}
                          style={[
                            styles.dropdownOption,
                            i !== 0 && styles.dropdownOptionBordered,
                          ]}
                          onPress={() => selectCity(c)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.dropdownOptionText}>{c.displayName}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            <Pressable
              style={styles.fieldCard}
              onPress={() => {
                Keyboard.dismiss();
                setShowDatePicker(true);
              }}
            >
              <Text style={styles.fieldLabel}>EVENT DATE</Text>
              <View style={styles.fieldValueRow}>
                <Text
                  style={[
                    styles.fieldValue,
                    !value.eventDate && styles.fieldValuePlaceholder,
                  ]}
                >
                  {value.eventDate ? formatDate(value.eventDate) : 'mm/dd/yyyy'}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={COLORS.black} />
              </View>
            </Pressable>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={onContinue}
            disabled={!canContinue}
            activeOpacity={0.9}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && Platform.OS === 'ios' && (
          <Pressable style={styles.dateOverlay} onPress={() => setShowDatePicker(false)}>
            <Pressable style={styles.dateModal} onPress={(e) => e.stopPropagation()}>
              <DateTimePicker
                value={value.eventDate ?? new Date()}
                mode="date"
                display="inline"
                onChange={(_, d) => {
                  if (d) patch({ eventDate: d });
                }}
                maximumDate={new Date(2030, 11, 31)}
                minimumDate={new Date(1950, 0, 1)}
                themeVariant="light"
              />
              <TouchableOpacity
                style={styles.dateConfirm}
                onPress={() => {
                  if (!value.eventDate) patch({ eventDate: new Date() });
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.dateConfirmText}>Done</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        )}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={value.eventDate ?? new Date()}
            mode="date"
            display="default"
            onChange={(e, d) => {
              setShowDatePicker(false);
              if (e.type === 'set' && d) patch({ eventDate: d });
            }}
            maximumDate={new Date(2030, 11, 31)}
            minimumDate={new Date(1950, 0, 1)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

function TeamDropdown({
  teams,
  onSelect,
}: {
  teams: SportTeam[];
  onSelect: (t: SportTeam) => void;
}) {
  if (teams.length === 0) return null;
  return (
    <View style={styles.dropdownAbsolute}>
      <ScrollView keyboardShouldPersistTaps="always" nestedScrollEnabled style={{ maxHeight: 200 }}>
        {teams.slice(0, 5).map((team, i) => (
          <TouchableOpacity
            key={team.name}
            style={[styles.dropdownOption, i !== 0 && styles.dropdownOptionBordered]}
            onPress={() => onSelect(team)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownOptionText}>{team.fullName}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_FADE,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 160,
    paddingBottom: 24,
  },
  headerRow: {
    marginBottom: 18,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.black,
    marginLeft: 6,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: FONTS.instrumentSerifItalic,
    fontSize: 34,
    color: COLORS.black,
    lineHeight: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.gray,
    lineHeight: 21,
    marginBottom: 24,
  },
  fieldsList: {
    gap: 14,
  },
  fieldCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    letterSpacing: 1.5,
    color: COLORS.gray,
    marginBottom: 6,
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  fieldValuePlaceholder: {
    color: COLORS.grayLight,
    fontFamily: FONTS.medium,
  },
  inlineInput: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.black,
    paddingVertical: 0,
  },
  inputWithDropdown: {
    position: 'relative',
    zIndex: 10,
  },
  dropdownPanel: {
    marginTop: 6,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
    overflow: 'hidden',
  },
  dropdownAbsolute: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECEC',
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownOptionBordered: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.black,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  continueButton: {
    backgroundColor: COLORS.black,
    borderRadius: 999,
    paddingVertical: 20,
    alignItems: 'center',
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.35,
  },
  continueText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  dateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  dateModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: '85%',
    alignItems: 'center',
  },
  dateConfirm: {
    backgroundColor: COLORS.black,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  dateConfirmText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
  },
});
