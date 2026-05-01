import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONTS } from '../theme/colors';

interface AboutScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function AboutScreen({ visible, onClose }: AboutScreenProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="chevron-down" size={22} color={COLORS.grayDark} />
          </TouchableOpacity>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  headerRow: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
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
