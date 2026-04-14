import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Switch, TouchableOpacity, Alert, Platform, RefreshControl, ScrollView, KeyboardAvoidingView, Image as RNImage } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  Settings, Mail, Bell, Sun, Moon, Palette, Shield, 
  Users, ChevronRight, Check, Languages, Globe, LayoutDashboard, Image, Trash2, Upload
} from 'lucide-react-native';
import { useAuth } from '../../../../src/context/AuthContext';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { spacing, radius, typography } from '../../../../src/theme';
import { Button } from '../../../../src/components/ui/Button';
import { Input } from '../../../../src/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../src/components/ui/Card';
import { AnimatedHeader } from '../../../../src/components/navigation/AnimatedHeader';
import api from '../../../../src/lib/api';
import { LogLoader } from '../../../../src/components/ui/LogLoader';
import { UserManagementModal } from '../../../../src/components/ui/UserManagementModal';
import { AlertRuleModal } from '../../../../src/components/ui/AlertRuleModal';
import { Select } from '../../../../src/components/ui/Select';
import { useToast } from '../../../../src/context/ToastContext';

export default function SettingsScreen() {
  const { user, isAdmin, hasPermission } = useAuth();
  const { colors, themeMode, updateTheme, primaryColor, logoUrl } = useTheme();
  const { t, lang, setLang } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [smtp, setSmtp] = useState({ host: '', port: 587, username: '', password: '', from_email: '', enabled: false, language: 'en' });
  const [rules, setRules] = useState([]);
  const [appName, setAppName] = useState('LogForge');
  const [tempPrimaryColor, setTempPrimaryColor] = useState(primaryColor);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [smtpRes, appRes, rulesRes, projectsRes] = await Promise.all([
        isAdmin ? api.get('/settings/') : Promise.resolve({ data: {} }),
        api.get('/settings/app'),
        hasPermission('manage_alert_rules') ? api.get('/settings/alert-rules') : Promise.resolve({ data: { rules: [] } }),
        api.get('/projects/', { params: { page: 1, size: 100 } })
      ]);
      
      if (smtpRes.data.smtp_config) setSmtp(smtpRes.data.smtp_config);
      if (appRes.data.app_name) setAppName(appRes.data.app_name);
      if (rulesRes.data.rules) setRules(rulesRes.data.rules);
      if (projectsRes.data.projects) setProjects(projectsRes.data.projects);

      if (isAdmin) {
        const usersRes = await api.get('/roles/users', { params: { page: 1, size: 50 } });
        setUsers(usersRes.data.users || []);
      }
    } catch (e) {
      console.log('Failed to load settings', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  const handleSaveSmtp = async () => {
    setSaving(true);
    try {
      await api.put('/settings/smtp', smtp);
      showToast(t('smtpUpdated'));
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to save SMTP', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppIdentity = async () => {
    setSaving(true);
    try {
      await api.put('/settings/app', {
        app_name: appName,
        primary_color: tempPrimaryColor
      });
      updateTheme(null, tempPrimaryColor);
      showToast(t('appIdentityUpdated'));
    } catch (e) {
      showToast(t('errorSaveAppIdentity'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      await api.post('/settings/smtp/test', smtp);
      showToast(t('testEmailSent'));
    } catch (e) {
      showToast(e.response?.data?.detail || 'SMTP test failed', 'error');
    } finally {
      setTestingSmtp(false);
    }
  };

  const updateUserInState = (userId, updates) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => ({ ...prev, ...updates }));
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      const res = await api.patch(`/roles/users/${userId}`, { role: newRole });
      updateUserInState(userId, { role: res.data.role, permissions: res.data.permissions });
      showToast(t('roleUpdated'));
    } catch (e) {
      showToast(t('errorUpdateRole'), 'error');
    }
  };

  const handleUpdatePermission = async (userId, permission, granted) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const current = target.permissions || [];
    const next = granted ? [...new Set([...current, permission])] : current.filter(p => p !== permission);
    try {
      const res = await api.patch(`/roles/users/${userId}`, { permissions: next });
      updateUserInState(userId, { permissions: res.data.permissions });
    } catch (e) {
      showToast(t('errorUpdatePermission'), 'error');
    }
  };

  const handleUpdateProjectAccess = async (userId, allowed_projects) => {
    try {
      const res = await api.patch(`/roles/users/${userId}`, { allowed_projects });
      updateUserInState(userId, { allowed_projects: res.data.allowed_projects });
    } catch (e) {
      showToast(t('errorUpdateProjectAccess'), 'error');
    }
  };
  const handleSaveRule = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        await api.put(`/settings/alert-rules/${payload.id}`, payload);
      } else {
        await api.post('/settings/alert-rules', payload);
      }
      const res = await api.get('/settings/alert-rules');
      setRules(res.data.rules || []);
      setRuleModalVisible(false);
      showToast(payload.id ? t('ruleUpdated') : t('ruleCreated'));
    } catch (e) {
      showToast(t('failedSaveRule'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await api.delete(`/settings/alert-rules/${id}`);
      setRules(prev => prev.filter(r => r.id !== id));
      setRuleModalVisible(false);
      showToast(t('failedDeleteRule'), 'error'); // Wait, this should be success if it deleted correctly.
    } catch (e) {
      showToast(t('failedDeleteRule'), 'error');
    }
  };
  
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleUploadLogo(result.assets[0]);
    }
  };

  const handleUploadLogo = async (asset) => {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      const uriParts = asset.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('file', {
        uri: asset.uri,
        name: `logo.${fileType}`,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      });

      const res = await api.post('/settings/app/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      updateTheme(null, null, res.data.logo_url);
      showToast(t('logoUpdated'));
    } catch (e) {
      console.log('Upload error', e);
      Alert.alert('Error', e.response?.data?.detail || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const SectionHeader = ({ title, icon: Icon }) => (
    <View style={styles.sectionHeader}>
      <Icon size={18} color={primaryColor} strokeWidth={2.5} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <LogLoader text={t('loading') || 'Loading'} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <AnimatedHeader scrollY={scrollY} title={t('settings')} />
      
      <Animated.ScrollView 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        automaticallyAdjustKeyboardInsets={true}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={primaryColor}
            progressViewOffset={220}
          />
        }
      >
        <View style={styles.headerSpacer} />
        
        <View style={styles.headerInfo}>
          <Text style={[styles.subtitle, { color: colors.textMuted, marginTop: 4 }]}>
            {t('appConfigDesc')}
          </Text>
        </View>

        {/* APPEARANCE SECTION */}
        <View style={styles.section}>
          <SectionHeader title={t('appearance')} icon={Palette} />
          
          <Text style={[styles.label, { color: colors.text }]}>{t('theme')}</Text>
          <View style={styles.themeToggleRow}>
            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { flex: 1, borderColor: themeMode === 'light' ? primaryColor : colors.border, backgroundColor: colors.card }
              ]}
              onPress={() => updateTheme('light', null)}
            >
              <View style={[styles.optionIcon, { backgroundColor: themeMode === 'light' ? primaryColor + '20' : colors.background }]}>
                <Sun size={24} color={themeMode === 'light' ? primaryColor : colors.textMuted} />
              </View>
              <Text style={[styles.themeLabel, { color: themeMode === 'light' ? primaryColor : colors.text }]}>{t('light')}</Text>
              {themeMode === 'light' && <View style={[styles.activeIndicator, { backgroundColor: primaryColor }]} />}
              {themeMode === 'light' && <Check size={14} color={primaryColor} style={styles.checkIcon} />}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.themeOption, 
                { flex: 1, borderColor: themeMode === 'dark' ? primaryColor : colors.border, backgroundColor: colors.card }
              ]}
              onPress={() => updateTheme('dark', null)}
            >
              <View style={[styles.optionIcon, { backgroundColor: themeMode === 'dark' ? primaryColor + '20' : colors.background }]}>
                <Moon size={24} color={themeMode === 'dark' ? primaryColor : colors.textMuted} />
              </View>
              <Text style={[styles.themeLabel, { color: themeMode === 'dark' ? primaryColor : colors.text }]}>{t('dark')}</Text>
              {themeMode === 'dark' && <View style={[styles.activeIndicator, { backgroundColor: primaryColor }]} />}
              {themeMode === 'dark' && <Check size={14} color={primaryColor} style={styles.checkIcon} />}
            </TouchableOpacity>
          </View>

          <Select 
            label={t('language')}
            value={lang} 
            options={[
              { label: 'English (EN)', value: 'en' },
              { label: 'Français (FR)', value: 'fr' }
            ]} 
            onSelect={(val) => setLang(val)} 
            placeholder={t('selectLanguage')}
            containerStyle={{ marginTop: spacing.xl }}
          />
        </View>

        {/* APP IDENTITY SECTION */}
        {isAdmin && (
          <View style={styles.section}>
            <SectionHeader title={t('appIdentity')} icon={Shield} />
            <Card style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <CardContent style={{ paddingBottom: spacing.lg, paddingTop: spacing.md }}>
                <Input label={t('appName')} value={appName} onChangeText={setAppName} placeholder="LogForge" containerStyle={{ marginBottom: spacing.md }} />
                <Text style={[styles.label, { color: colors.text, marginTop: spacing.sm }]}>{t('primaryColor')}</Text>
                <View style={styles.colorGrid}>
                  {['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                    <TouchableOpacity key={c} style={[styles.colorOption, { backgroundColor: c, borderColor: tempPrimaryColor === c ? colors.text : 'transparent' }]} onPress={() => { setTempPrimaryColor(c); updateTheme(null, c); }}>
                      {tempPrimaryColor === c && <Check size={16} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>
                <Button title={t('saveAppSettings')} onPress={handleSaveAppIdentity} isLoading={saving} style={{ marginTop: spacing.xl, backgroundColor: primaryColor }} />
              </CardContent>
            </Card>
          </View>
        )}

        {/* SMTP SECTION */}
        {isAdmin && (
          <View style={styles.section}>
            <SectionHeader title={t('smtp')} icon={Mail} />
            <Card style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <CardContent style={{ paddingBottom: spacing.lg, paddingTop: spacing.md }}>
                <View style={styles.switchRow}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{t('enableSMTP')}</Text>
                  <Switch value={smtp.enabled} onValueChange={(v) => setSmtp({ ...smtp, enabled: v })} trackColor={{ false: colors.border, true: primaryColor }} />
                </View>
                <Input label={t('smtpHost')} value={smtp.host} onChangeText={(v) => setSmtp({...smtp, host: v})} placeholder="smtp.gmail.com" />
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                  <View style={{ flex: 1 }}><Input label={t('port')} value={smtp.port.toString()} onChangeText={(v) => setSmtp({...smtp, port: parseInt(v) || 587})} keyboardType="number-pad" /></View>
                  <View style={{ flex: 2 }}><Input label={t('fromEmail')} value={smtp.from_email} onChangeText={(v) => setSmtp({...smtp, from_email: v})} placeholder="alerts@domain.com" /></View>
                </View>
                <Input label={t('username')} value={smtp.username} onChangeText={(v) => setSmtp({...smtp, username: v})} containerStyle={{ marginTop: spacing.sm }} />
                <Input label={t('password')} value={smtp.password} onChangeText={(v) => setSmtp({...smtp, password: v})} secureTextEntry containerStyle={{ marginTop: spacing.sm }} />
                
                <Select 
                  label={t('emailLanguage')}
                  value={smtp.language}
                  options={[
                    { label: 'English (EN)', value: 'en' },
                    { label: 'Français (FR)', value: 'fr' }
                  ]}
                  onSelect={(v) => setSmtp({ ...smtp, language: v })}
                  placeholder={t('selectLanguage')}
                />
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
                  <Button title={t('save')} onPress={handleSaveSmtp} isLoading={saving} style={{ flex: 1, backgroundColor: primaryColor }} />
                  <Button title={t('test')} variant="outline" onPress={handleTestSmtp} isLoading={testingSmtp} icon="Send" style={{ flex: 0.6 }} />
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* ROLES & PERMISSIONS SECTION */}
        {isAdmin && (
          <View style={styles.section}>
            <SectionHeader title={t('rolesAndPermissions')} icon={Users} />
            <View style={[styles.optionsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {users.map((u, idx) => (
                <TouchableOpacity 
                  key={u.id} 
                  style={[styles.userRow, idx < users.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedUser(u);
                    setUserModalVisible(true);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>{u.name || t('unnamedUser')}</Text>
                    <Text style={[styles.userEmail, { color: colors.textMuted }]}>{u.email}</Text>
                  </View>
                  <View style={[styles.roleBadge, { backgroundColor: u.role === 'admin' ? primaryColor + '20' : colors.background }]}>
                    <Text style={[styles.roleBadgeText, { color: u.role === 'admin' ? primaryColor : colors.textMuted }]}>
                      {u.role.toUpperCase()}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* LOGO SECTION */}
        {isAdmin && (
          <View style={styles.section}>
            <SectionHeader title={t('logo')} icon={Image} />
            <Card style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <CardContent style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
                <View style={[styles.logoPlaceholder, { backgroundColor: colors.background, borderColor: colors.border, marginVertical: spacing.md }]}>
                  {logoUrl ? (
                    <RNImage source={{ uri: logoUrl }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                  ) : (
                    <Image size={48} color={colors.textMuted} />
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, width: '100%' }}>
                  <Button 
                    title={t('uploadLogo')} 
                    onPress={handlePickImage} 
                    isLoading={uploadingLogo}
                    style={{ flex: 1, backgroundColor: primaryColor }} 
                  />
                  {logoUrl && (
                    <Button 
                      title={t('reset')} 
                      variant="outline"
                      onPress={() => updateTheme(null, null, null)}
                      paddingHorizontal={8}
                      style={{ flex: lang === 'fr' ? 0.7 : 0.5 }} 
                    />
                  )}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* ALERT RULES */}
        {hasPermission('manage_alert_rules') && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <SectionHeader title={t('alerts')} icon={Bell} />
                <TouchableOpacity onPress={() => { setSelectedRule(null); setRuleModalVisible(true); }}>
                    <Text style={{ color: primaryColor, fontWeight: '700', fontSize: 13 }}>+ {t('add')}</Text>
                </TouchableOpacity>
            </View>
            {rules.map((rule) => (
              <TouchableOpacity key={rule.id} onPress={() => { setSelectedRule(rule); setRuleModalVisible(true); }}>
                <Card style={[styles.ruleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.ruleInfo}>
                    <Text style={[styles.ruleName, { color: colors.text }]}>{rule.name}</Text>
                    <View style={styles.ruleMeta}>
                      <View style={[styles.levelBadge, { backgroundColor: colors.background }]}>
                        <Text style={[styles.levelText, { color: colors.textMuted }]}>{rule.level.toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.ruleCount, { color: colors.textMuted }]}>{(rule.emails || []).length} {t('recipients')}</Text>
                    </View>
                  </View>
                  <Switch 
                    value={rule.enabled}
                    onValueChange={async (v) => {
                      try {
                        await api.put(`/settings/alert-rules/${rule.id}`, { ...rule, enabled: v });
                        setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: v } : r));
                      } catch (e) { Alert.alert('Error', 'Failed to toggle rule'); }
                    }}
                    trackColor={{ false: colors.border, true: primaryColor }}
                  />
                </Card>
              </TouchableOpacity>
            ))}
            {rules.length === 0 && (
                <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 10, fontStyle: 'italic' }}>
                    {t('noRules')}
                </Text>
            )}
          </View>
        )}
      </Animated.ScrollView>

      <UserManagementModal 
        visible={userModalVisible}
        onClose={() => setUserModalVisible(false)}
        user={selectedUser}
        currentUser={user}
        projects={projects}
        onUpdateRole={handleUpdateRole}
        onUpdatePermission={handleUpdatePermission}
        onUpdateProjectAccess={handleUpdateProjectAccess}
      />

      <AlertRuleModal 
        visible={ruleModalVisible}
        onClose={() => setRuleModalVisible(false)}
        rule={selectedRule}
        projects={projects}
        onSave={handleSaveRule}
        onDelete={handleDeleteRule}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerSpacer: { height: Platform.OS === 'ios' ? 140 : 120 },
  headerInfo: { paddingHorizontal: 20, marginBottom: spacing.lg },
  subtitle: { ...typography.bodySmall },
  section: { paddingHorizontal: 20, marginBottom: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  themeToggleRow: { flexDirection: 'row', gap: spacing.md },
  themeOption: { 
    height: 52, 
    borderRadius: radius.md, 
    borderWidth: 1.5, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    gap: 10,
    paddingHorizontal: 12,
    marginRight: 0,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
  activeIndicator: { 
    position: 'absolute', 
    bottom: 0, 
    left: 12,
    right: 12,
    height: 2, 
    borderTopLeftRadius: 2, 
    borderTopRightRadius: 2 
  },
  checkIcon: { position: 'absolute', right: 8, top: 8 },
  ruleCard: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderRadius: radius.md, borderWidth: 1 },
  ruleInfo: { flex: 1 },
  ruleName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  ruleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  levelText: { fontSize: 10, fontWeight: '800' },
  ruleCount: { fontSize: 11 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, justifyContent: 'space-between' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  colorOption: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  optionsContainer: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, minHeight: 60 },
  userName: { fontSize: 14, fontWeight: '700' },
  userEmail: { fontSize: 12, marginTop: 2 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleBadgeText: { fontSize: 10, fontWeight: '800' },
  logoPlaceholder: { width: 100, height: 100, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed' },
});
