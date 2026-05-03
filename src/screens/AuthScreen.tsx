import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const fieldsFilled =
    email.trim().length > 0 &&
    password.length > 0 &&
    (!isSignUp || confirmPassword.length > 0);

  const switchTab = (toSignUp: boolean) => {
    if (toSignUp === isSignUp) return;
    setIsSignUp(toSignUp);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async () => {
    if (!email || !password || (isSignUp && !confirmPassword)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);
      if (error) {
        Alert.alert('Error', error.message);
      } else if (isSignUp) {
        Alert.alert('Success', 'Account created! You can now sign in.');
        switchTab(false);
      }
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Front Row</Text>
          <Text style={styles.subtitle}>Never forget that moment</Text>
        </View>

        {/* Side-by-side tab headers */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => switchTab(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, !isSignUp && styles.tabTextActive]}>SIGN IN</Text>
            {!isSignUp && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => switchTab(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isSignUp && styles.tabTextActive]}>CREATE ACCOUNT</Text>
            {isSignUp && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>
        <View style={styles.tabDivider} />

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.grayLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder={isSignUp ? 'Min 8 characters' : '••••••••'}
              placeholderTextColor={COLORS.grayLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[
                  styles.input,
                  confirmPassword.length > 0 && password !== confirmPassword && styles.inputError,
                ]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.grayLight}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorText}>Passwords don't match</Text>
              )}
            </View>
          )}
          <TouchableOpacity
            style={[styles.button, fieldsFilled && styles.buttonFilled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={[styles.buttonText, fieldsFilled ? styles.buttonTextFilled : styles.buttonTextEmpty]}>
                {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'} →
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING.xxl },
  title: {
    fontFamily: 'GeistMono_700Bold',
    fontSize: 48,
    color: COLORS.navy,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.md,
    color: COLORS.grayDark,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: SPACING.sm,
  },
  tabText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 1.5,
    color: COLORS.gray,
  },
  tabTextActive: {
    color: COLORS.navy,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: SPACING.lg,
    right: SPACING.lg,
    height: 2.5,
    backgroundColor: COLORS.gold,
    borderRadius: BORDER_RADIUS.full,
  },
  tabDivider: {
    height: 1,
    backgroundColor: COLORS.creamDark,
    marginBottom: SPACING.xxl,
  },
  form: { width: '100%' },
  inputContainer: { marginBottom: SPACING.lg },
  label: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.navy,
    marginBottom: SPACING.sm,
  },
  input: {
    fontFamily: FONTS.regular,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.navy,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  button: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.navy,
    backgroundColor: COLORS.white,
  },
  buttonFilled: {
    backgroundColor: COLORS.navy,
    borderColor: COLORS.navy,
  },
  buttonText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
    letterSpacing: 1,
  },
  buttonTextEmpty: {
    color: COLORS.grayLight,
  },
  buttonTextFilled: {
    color: COLORS.white,
  },
});
