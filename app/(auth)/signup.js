import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Rocket, User, Mail, Lock, Languages, Sun, Moon } from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../src/components/ui/Card';
import { spacing, radius, typography } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import api from '../../src/lib/api';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup: authSignup } = useAuth();
  const { colors, updateTheme, isDark, primaryColor } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert(t('errorSignupFailed'), t('errorFillFields'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/signup', {
        name,
        email,
        password
      });

      if (res.data.access_token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
        const userRes = await api.get('/auth/me');
        await authSignup(res.data.access_token, userRes.data);
        router.replace('/(main)/(tabs)/dashboard');
        // Autoredirect happens via context usually, but we help it if needed
      } else {
        Alert.alert('Success', t('successAccountCreated'));
        router.push('/(auth)/login');
      }
    } catch (error) {
      console.log('Signup error:', error.response?.data || error.message);
      Alert.alert(t('errorSignupFailed'), error.response?.data?.detail || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'fr' : 'en');
  };

  const toggleTheme = () => {
    updateTheme(isDark ? 'light' : 'dark', null);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Top Floating Actions: Theme & Language Toggle */}
        <View style={styles.topActions}>
          <TouchableOpacity 
            onPress={toggleTheme} 
            style={[styles.iconToggle, { borderColor: colors.border, backgroundColor: colors.card, marginRight: 8 }]}
          >
            {isDark ? <Sun size={16} color={colors.textMuted} /> : <Moon size={16} color={colors.textMuted} />}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={toggleLanguage} 
            style={[styles.langToggle, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Languages size={16} color={colors.textMuted} />
            <Text style={{color: colors.text, fontSize: 12, fontWeight: 'bold', marginLeft: 6}}>{lang.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: primaryColor, shadowColor: primaryColor }]}>
            <Rocket size={24} color="#fff" />
          </View>
          <Text style={[styles.appNameTitle, { color: colors.text }]}>LogForge</Text>
        </View>

        <Card style={styles.card}>
          <CardHeader style={styles.cardHeaderCenter}>
            <CardTitle>{t('createAccount')}</CardTitle>
            <CardDescription>{t('signupDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Text style={[styles.label, { color: colors.text }]}>{t('name')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <User size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={[styles.textInput, { color: colors.text }]}
                placeholder="John Doe"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={[styles.label, { marginTop: spacing.md, color: colors.text }]}>{t('email')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={[styles.textInput, { color: colors.text }]}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={[styles.label, { marginTop: spacing.md, color: colors.text }]}>{t('password')}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput 
                style={[styles.textInput, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </CardContent>
          <CardFooter>
            <Button 
              title={t('signUp')} 
              onPress={handleSignup} 
              isLoading={loading} 
              style={[styles.fullButton, { backgroundColor: primaryColor }]}
            />
          </CardFooter>
        </Card>
        
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={[styles.actionText, { color: primaryColor }]}>{t('alreadyHaveAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  topActions: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
  },
  iconToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  appNameTitle: {
    ...typography.h1,
    fontWeight: '800',
  },
  card: { width: '100%', maxWidth: 450, alignSelf: 'center' },
  cardHeaderCenter: { alignItems: 'center' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    height: 48,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingLeft: 40,
    paddingRight: 12,
  },
  fullButton: {
    width: '100%',
    height: 48,
  },
  actions: { marginTop: spacing.xl, alignItems: 'center' },
  actionText: {
    ...typography.bodySmall,
    fontWeight: '600',
  }
});
