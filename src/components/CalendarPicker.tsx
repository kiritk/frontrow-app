import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../theme/colors';

const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

interface CalendarPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function CalendarPicker({ selectedDate, onDateChange, minimumDate, maximumDate }: CalendarPickerProps) {
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSelectedDay = (day: number) => {
    return selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;
  };

  const isToday = (day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isDayDisabled = (day: number) => {
    const d = new Date(year, month, day);
    if (minimumDate && d < minimumDate) return true;
    if (maximumDate && d > maximumDate) return true;
    return false;
  };

  const goToPreviousMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const selectDay = (day: number) => {
    if (isDayDisabled(day)) return;
    const newDate = new Date(year, month, day);
    onDateChange(newDate);
  };

  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return (
    <View style={styles.container}>
      {/* Month header with navigation */}
      <View style={styles.header}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <View style={styles.navButtons}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={22} color={COLORS.navy} />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={22} color={COLORS.navy} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Day of week headers */}
      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map(day => (
          <View key={day} style={styles.dayCell}>
            <Text style={styles.dayOfWeekLabel}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => (
            <View key={dayIndex} style={styles.dayCell}>
              {day !== null ? (
                <TouchableOpacity
                  onPress={() => selectDay(day)}
                  disabled={isDayDisabled(day)}
                  style={[
                    styles.dayButton,
                    isSelectedDay(day) && styles.selectedDayButton,
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    isToday(day) && styles.todayText,
                    isSelectedDay(day) && styles.selectedDayText,
                    isDayDisabled(day) && styles.disabledDayText,
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  monthLabel: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    padding: 4,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dayOfWeekLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDayButton: {
    backgroundColor: COLORS.navy,
  },
  dayText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  todayText: {
    color: '#007AFF',
    fontFamily: FONTS.bold,
  },
  selectedDayText: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  disabledDayText: {
    color: COLORS.grayLight,
  },
});
