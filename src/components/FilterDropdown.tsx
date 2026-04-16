import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap | null;
}

interface FilterDropdownProps {
  label: string;                    // "Year", "Category", "Continent"
  value: string;                    // currently selected value (option.value)
  options: DropdownOption[];
  onSelect: (value: string) => void;
  // When true, show the selected option's icon on the pill. Used for Category.
  showIconOnPill?: boolean;
  // Optional explicit default value — used to decide when to show the label
  // vs the selected value on the pill. Defaults to the first option's value.
  defaultValue?: string;
}

export default function FilterDropdown({
  label,
  value,
  options,
  onSelect,
  showIconOnPill = false,
  defaultValue,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  const defaultVal = defaultValue ?? options[0]?.value;
  const isDefault = value === defaultVal;
  const selected = options.find(o => o.value === value);

  // Pill shows the filter label when at default ("All"), otherwise the
  // selected option's label so the current filter is visible at a glance.
  const pillText = isDefault ? label : selected?.label ?? label;
  const pillIcon = showIconOnPill && selected?.icon ? selected.icon : null;

  const handleSelect = (next: string) => {
    onSelect(next);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.pill, !isDefault && styles.pillActive]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        {pillIcon && (
          <Ionicons
            name={pillIcon}
            size={14}
            color={isDefault ? COLORS.navy : COLORS.white}
            style={{ marginRight: 4 }}
          />
        )}
        <Text style={[styles.pillText, !isDefault && styles.pillTextActive]} numberOfLines={1}>
          {pillText}
        </Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={isDefault ? COLORS.navy : COLORS.white}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionLeft}>
                      {item.icon && (
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={COLORS.navy}
                          style={{ marginRight: SPACING.sm }}
                        />
                      )}
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {item.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={COLORS.navy} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    height: 36,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pillActive: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  pillText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
  },
  pillTextActive: {
    color: COLORS.white,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl + SPACING.lg,
    maxHeight: '70%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.creamDark,
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.navy,
    marginBottom: SPACING.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  optionTextSelected: {
    fontFamily: FONTS.semiBold,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.creamDark,
    opacity: 0.6,
  },
});
