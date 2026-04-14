import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Bell, Trash2, Save, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { spacing, radius, typography } from '../../theme';
import { Button } from './Button';
import { Input } from './Input';

export const AlertRuleModal = ({ visible, onClose, rule, projects, onSave, onDelete }) => {
  const { colors, primaryColor } = useTheme();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    name: '',
    level: 'error',
    project_id: '',
    emails: '',
    enabled: true
  });

  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name || '',
        level: rule.level || 'error',
        project_id: rule.project_id || '',
        emails: (rule.emails || []).join(', '),
        enabled: rule.enabled ?? true
      });
    } else {
      setForm({ name: '', level: 'error', project_id: '', emails: '', enabled: true });
    }
  }, [rule, visible]);

  const handleSave = () => {
    if (!form.name) {
      Alert.alert(lang === 'fr' ? 'Erreur' : 'Error', lang === 'fr' ? 'Le nom est requis' : 'Name is required');
      return;
    }
    
    // Parse emails
    const emailList = form.emails.split(',').map(e => e.trim()).filter(Boolean);
    
    onSave({
      ...rule,
      ...form,
      emails: emailList,
      project_id: form.project_id === 'any' ? null : form.project_id
    });
  };

  const handleDelete = () => {
    Alert.alert(
      lang === 'fr' ? 'Supprimer la règle' : 'Delete Rule',
      lang === 'fr' ? 'Êtes-vous sûr ?' : 'Are you sure?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: lang === 'fr' ? 'Supprimer' : 'Delete', style: 'destructive', onPress: () => onDelete(rule.id) }
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose} statusBarTranslucent={true}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                {rule ? t('editRule') : t('newRule')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                {rule ? t('modifyExistingConfig') : t('configureNewAlert')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
            <Input 
              label={t('ruleName')} 
              value={form.name} 
              onChangeText={(v) => setForm({...form, name: v})}
              placeholder={lang === 'fr' ? 'Erreurs Critiques' : 'Critical Errors'}
              containerStyle={{ marginBottom: spacing.md }}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t('logLevel')}</Text>
            <View style={styles.levelRow}>
              {['debug', 'info', 'warning', 'error', 'critical'].map(lvl => (
                <TouchableOpacity 
                  key={lvl} 
                  onPress={() => setForm({...form, level: lvl})}
                  style={[
                    styles.levelTab, 
                    { borderColor: colors.border },
                    form.level === lvl && { backgroundColor: primaryColor, borderColor: primaryColor }
                  ]}
                >
                  <Text style={[styles.levelTabText, { color: form.level === lvl ? '#fff' : colors.textMuted }]}>
                    {lvl.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: spacing.lg }]}>{t('project')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                <TouchableOpacity 
                  onPress={() => setForm({...form, project_id: 'any'})}
                  style={[styles.projectTab, { borderColor: form.project_id === 'any' || !form.project_id ? primaryColor : colors.border }]}
                >
                  <Text style={{ color: form.project_id === 'any' || !form.project_id ? primaryColor : colors.textMuted }}>{t('any')}</Text>
                </TouchableOpacity>
                {projects.map(p => (
                   <TouchableOpacity 
                    key={p.id}
                    onPress={() => setForm({...form, project_id: p.id})}
                    style={[styles.projectTab, { borderColor: form.project_id === p.id ? primaryColor : colors.border }]}
                  >
                    <Text style={{ color: form.project_id === p.id ? primaryColor : colors.textMuted }}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <Input 
              label={t('recipientsEmails')} 
              value={form.emails} 
              onChangeText={(v) => setForm({...form, emails: v})}
              placeholder="admin@example.com"
              containerStyle={{ marginTop: spacing.md }}
            />

            {rule && (
              <Button 
                title={t('deleteProject')} 
                variant="outline" 
                onPress={handleDelete}
                style={{ marginTop: spacing.xl, borderColor: '#ef4444' }}
                textStyle={{ color: '#ef4444' }}
              />
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom + 30, 60) }]}>
            <Button title={t('cancel')} variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <Button title={t('save')} onPress={handleSave} style={{ flex: 1, backgroundColor: primaryColor }} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  content: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, maxHeight: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.lg, maxHeight: 500 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  levelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelTab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  levelTabText: { fontSize: 10, fontWeight: '800' },
  projectTab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderTopWidth: 1 },
});
