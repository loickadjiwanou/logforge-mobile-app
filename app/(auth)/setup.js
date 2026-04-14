import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Rocket, ShieldCheck, UserPlus, ChevronRight, ChevronLeft, Palette, Layout, User, Mail, Lock, Languages, Sun, Moon } from 'lucide-react-native';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../src/components/ui/Card';
import { spacing, radius, typography } from '../../src/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';
import api from '../../src/lib/api';
import { LogLoader } from '../../src/components/ui/LogLoader';

const PRESET_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Indigo', value: '#6366f1' },
];

export default function SetupScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    app_name: 'LogForge',
    primary_color: '#10b981',
    theme: 'dark'
  });
  const { login } = useAuth();
  const { colors, updateTheme, isDark } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const res = await api.get('/setup/status');
      if (res.data.is_setup) {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.log('Setup check failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleColorSelect = (color) => {
    handleChange('primary_color', color);
    updateTheme(null, color); // Apply theme color interactively
  };

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'fr' : 'en');
  };

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updateTheme(newTheme, null);
    handleChange('theme', newTheme);
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', t('passwordTooShort') || 'Password must be at least 8 characters');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await api.post('/setup/admin', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        app_name: formData.app_name,
        primary_color: formData.primary_color,
        theme: formData.theme
      });
      
      const { access_token, user: userData } = res.data;
      
      Alert.alert('Success', 'LogForge setup successfully completed!');
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      await login(access_token, userData);
      
      router.replace('/(main)/dashboard');
    } catch (error) {
      Alert.alert('Setup Failed', error.response?.data?.detail || 'Failed to complete setup');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <LogLoader text={t('loading') || 'Loading'} />
      </View>
    );
  }

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
        
        {/* Header Elements */}
        <View style={styles.header}>
          <View style={[styles.iconBox, { backgroundColor: formData.primary_color, shadowColor: formData.primary_color }]}>
            <Rocket size={24} color="#fff" />
          </View>
          <Text style={[styles.appNameTitle, { color: colors.text }]}>{formData.app_name}</Text>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View 
              key={s} 
              style={[
                styles.progressDot, 
                { backgroundColor: colors.border },
                step === s ? [styles.progressDotActive, { backgroundColor: formData.primary_color }] : null
              ]} 
            />
          ))}
        </View>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card style={styles.card}>
            <CardHeader style={styles.cardHeaderCenter}>
              <CardTitle>{t('welcome')}</CardTitle>
              <CardDescription style={{textAlign: 'center'}}>{t('welcomeDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <View style={[styles.featureItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ShieldCheck size={20} color="#34d399" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{t('secureByDesign')}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{t('secureDesc')}</Text>
                </View>
              </View>
              <View style={[styles.featureItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Rocket size={20} color="#60a5fa" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{t('realTime')}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{t('realTimeDesc')}</Text>
                </View>
              </View>
            </CardContent>
            <CardFooter>
              <Button 
                title={t('startConfig')} 
                onPress={handleNext} 
                style={[styles.fullButton, { backgroundColor: formData.primary_color }]} 
              />
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Customization */}
        {step === 2 && (
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.titleRow}>
                <Palette size={24} color={formData.primary_color} style={{marginRight: 8}} />
                <CardTitle>{t('appCustomization')}</CardTitle>
              </View>
              <CardDescription>{t('appCustomizationDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Text style={[styles.label, { color: colors.text }]}>{t('appName')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Layout size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="LogForge"
                  placeholderTextColor={colors.textMuted}
                  value={formData.app_name}
                  onChangeText={(val) => handleChange('app_name', val)}
                />
              </View>

              <Text style={[styles.label, {marginTop: spacing.md, color: colors.text }]}>{t('primaryColor')}</Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map(c => (
                  <TouchableOpacity
                    key={c.value}
                    onPress={() => handleColorSelect(c.value)}
                    style={[
                      styles.colorSquare, 
                      { backgroundColor: c.value, borderColor: 'transparent' },
                      formData.primary_color === c.value && { borderColor: colors.text }
                    ]}
                  />
                ))}
              </View>

              <View style={[styles.hexWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.hexPreview, { backgroundColor: formData.primary_color }]} />
                <TextInput 
                  style={[styles.hexInput, { color: colors.text }]}
                  value={formData.primary_color}
                  onChangeText={(val) => handleColorSelect(val)}
                />
              </View>
            </CardContent>
            <CardFooter style={styles.buttonRow}>
              <Button 
                title={t('back')} 
                variant="outline"
                onPress={handleBack} 
                style={styles.halfButton} 
              />
              <Button 
                title={t('next')} 
                onPress={handleNext} 
                style={[styles.halfButton, { flex: 2, backgroundColor: formData.primary_color }]} 
              />
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Admin Setup */}
        {step === 3 && (
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.titleRow}>
                <UserPlus size={24} color={formData.primary_color} style={{marginRight: 8}} />
                <CardTitle>{t('adminSetup')}</CardTitle>
              </View>
              <CardDescription>{t('adminSetupDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Text style={[styles.label, { color: colors.text }]}>{t('fullName')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <User size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="John Doe"
                  placeholderTextColor={colors.textMuted}
                  value={formData.name}
                  onChangeText={(val) => handleChange('name', val)}
                />
              </View>

              <Text style={[styles.label, {marginTop: spacing.md, color: colors.text }]}>{t('email')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="admin@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(val) => handleChange('email', val)}
                />
              </View>

              <Text style={[styles.label, {marginTop: spacing.md, color: colors.text }]}>{t('password')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(val) => handleChange('password', val)}
                />
              </View>

              <Text style={[styles.label, {marginTop: spacing.md, color: colors.text }]}>{t('confirmPassword')}</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  value={formData.confirmPassword}
                  onChangeText={(val) => handleChange('confirmPassword', val)}
                />
              </View>
            </CardContent>
            <CardFooter style={styles.buttonRow}>
              <Button 
                title={t('back')} 
                variant="outline"
                onPress={handleBack} 
                style={styles.halfButton} 
                disabled={submitLoading}
              />
              <Button 
                title={t('completeSetup')} 
                onPress={handleSubmit} 
                isLoading={submitLoading}
                style={[styles.halfButton, { flex: 2, backgroundColor: formData.primary_color }]} 
              />
            </CardFooter>
          </Card>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  header: { alignItems: 'center', marginBottom: spacing.xl, marginTop: 40 },
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
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: 8,
  },
  progressDot: {
    height: 6,
    width: 8,
    borderRadius: 3,
  },
  progressDotActive: {
    width: 32,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardHeaderCenter: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  fullButton: {
    width: '100%',
    height: 48,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfButton: {
    flex: 1,
    height: 48,
  },
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
    height: 44,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  colorSquare: {
    width: '47%',
    height: 50,
    borderRadius: radius.md,
    borderWidth: 4,
  },
  hexWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 8,
    gap: 8,
  },
  hexPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  hexInput: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  }
});
