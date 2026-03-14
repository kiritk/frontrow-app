import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, FONTS } from '../theme/colors';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

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
    <LinearGradient colors={[COLORS.navy, COLORS.navyDark]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>🎫</Text>
            <Text style={styles.title}>Front Row</Text>
            <Text style={styles.subtitle}>Track your live event memories</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={COLORS.grayLight} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={COLORS.grayLight} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
            </View>
            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.navy} /> : <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleButton}>
              <Text style={styles.toggleText}>{isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING.xxl },
  logo: { fontSize: 64, marginBottom: SPACING.md },
  title: { fontFamily: FONTS.bold, fontSize: 48, color: COLORS.cream, marginBottom: SPACING.sm },
  subtitle: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.md, color: COLORS.creamDark, textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: { marginBottom: SPACING.lg },
  label: { fontFamily: FONTS.medium, fontSize: FONT_SIZES.sm, color: COLORS.cream, marginBottom: SPACING.sm },
  input: { fontFamily: FONTS.regular, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.navy },
  button: { backgroundColor: COLORS.cream, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontFamily: FONTS.semiBold, fontSize: FONT_SIZES.lg, color: COLORS.navy },
  toggleButton: { marginTop: SPACING.lg, alignItems: 'center' },
  toggleText: { fontFamily: FONTS.regular, fontSize: FONT_SIZES.sm, color: COLORS.creamDark },
});
