import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../theme/colors';

interface AboutScreenProps {
  onBack: () => void;
}

export default function AboutScreen({ onBack }: AboutScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={22} color={COLORS.grayDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>About Us</Text>

        <Text style={styles.body}>
          Front Row was built by fans, for fans. We wanted a better way to stay connected to the live events we love, so we built one ourselves. No corporate agenda, no boardroom decisions — just a genuine passion for bringing fans closer to the action.
        </Text>

        <Text style={styles.body}>
          Front Row is completely free to use, with no ads, no premium tiers, and no hidden costs. We believe great tools should be accessible to everyone. We're always looking to make the experience better, so if you have ideas, feedback, or just want to say hi, please don't hesitate to reach out to us via our socials.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cream,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.grayDark,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 48,
  },
  title: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 32,
    color: COLORS.navy,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.grayDark,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: SPACING.lg,
  },
});
