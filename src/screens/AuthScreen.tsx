import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

const OLIVE_GREEN = '#6B8E23';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const fieldsFilled = email.trim().length > 0 && password.length > 0;

  const handleSubmit = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);
      if (error) { Alert.alert('Error', error.message); }
      else if (isSignUp) { Alert.alert('Success', 'Account created! You can now sign in.'); setIsSignUp(false); }
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🎫</Text>
          <Text style={styles.title}>Front Row</Text>
          <Text style={styles.subtitle}>Never forget that moment</Text>
        </View>
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
              placeholder="••••••••"
              placeholderTextColor={COLORS.grayLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={[styles.buttonText, fieldsFilled ? styles.buttonTextFilled : styles.buttonTextEmpty]}>
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleButton}>
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </Text>
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
  logo: { fontSize: 64, marginBottom: SPACING.md },
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
  button: {
    backgroundColor: COLORS.navy,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonText: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.lg,
  },
  buttonTextEmpty: {
    color: COLORS.gray,
  },
  buttonTextFilled: {
    color: COLORS.white,
  },
  toggleButton: { marginTop: SPACING.lg, alignItems: 'center' },
  toggleText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: OLIVE_GREEN,
  },
});
