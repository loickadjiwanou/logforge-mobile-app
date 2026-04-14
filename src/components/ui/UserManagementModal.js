import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Switch, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Shield, Users, Lock, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { spacing, radius, typography } from '../../theme';
import { Button } from './Button';
import { Card } from './Card';

const PERMISSIONS = [
  { key: 'manage_smtp', label: 'SMTP Configuration', label_fr: 'Configuration SMTP' },
  { key: 'manage_alert_rules', label: 'Alert Rules', label_fr: 'Règles d\'Alerte' },
  { key: 'delete_projects', label: 'Delete Projects', label_fr: 'Suppression de Projets' },
];

export const UserManagementModal = ({ visible, onClose, user, currentUser, projects, onUpdateRole, onUpdatePermission, onUpdateProjectAccess }) => {
  const { colors, primaryColor, isDark } = useTheme();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const userPermissions = user.permissions || [];
  const allowedProjects = user.allowed_projects || [];

  const handleRoleToggle = async () => {
    if (user.id === currentUser?.id && user.role === 'admin') {
      Alert.alert(
        lang === 'fr' ? 'Action Impossible' : 'Action Not Allowed',
        lang === 'fr' ? 'Vous ne pouvez pas modifier votre propre rôle d\'administrateur.' : 'You cannot change your own administrator role.'
      );
      return;
    }
    const newRole = user.role === 'admin' ? 'member' : 'admin';
    setLoading(true);
    await onUpdateRole(user.id, newRole);
    setLoading(false);
  };

  const handlePermissionToggle = async (permissionKey, granted) => {
    await onUpdatePermission(user.id, permissionKey, granted);
  };

  const handleProjectToggle = async (projectId) => {
    const isAllowed = allowedProjects.includes(projectId);
    const newProjects = isAllowed 
      ? allowedProjects.filter(id => id !== projectId)
      : [...allowedProjects, projectId];
    await onUpdateProjectAccess(user.id, newProjects);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>{user.name || user.email}</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>{user.email}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.background }]}>
              <X size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            {/* ROLE SECTION */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{lang === 'fr' ? 'RÔLE' : 'ROLE'}</Text>
              <TouchableOpacity 
                onPress={handleRoleToggle}
                style={[
                  styles.roleCard, 
                  { backgroundColor: colors.background, borderColor: colors.border },
                  user.role === 'admin' && { borderColor: primaryColor }
                ]}
              >
                <View style={[styles.roleIcon, { backgroundColor: user.role === 'admin' ? primaryColor : colors.border + '20' }]}>
                  {user.role === 'admin' ? <Shield size={18} color="#fff" /> : <Users size={18} color={colors.textMuted} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleName, { color: colors.text }]}>
                    {user.role === 'admin' ? t('administrator') : t('member')}
                  </Text>
                  <Text style={[styles.roleDesc, { color: colors.textMuted }]}>
                    {user.role === 'admin' ? t('adminAccessDesc') : t('memberAccessDesc')}
                  </Text>
                </View>
                <Switch 
                  value={user.role === 'admin'} 
                  onValueChange={handleRoleToggle}
                  trackColor={{ false: colors.border, true: primaryColor }}
                />
              </TouchableOpacity>
            </View>

            {/* PERMISSIONS SECTION */}
            {user.role !== 'admin' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{lang === 'fr' ? 'PERMISSIONS' : 'PERMISSIONS'}</Text>
                <View style={[styles.optionsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {PERMISSIONS.map((perm, idx) => (
                    <View 
                      key={perm.key} 
                      style={[
                        styles.optionRow, 
                        idx < PERMISSIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionLabel, { color: colors.text }]}>{lang === 'fr' ? perm.label_fr : perm.label}</Text>
                      </View>
                      <Switch 
                        value={userPermissions.includes(perm.key)}
                        onValueChange={(v) => handlePermissionToggle(perm.key, v)}
                        trackColor={{ false: colors.border, true: primaryColor }}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* PROJECT ACCESS SECTION */}
            {user.role !== 'admin' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{lang === 'fr' ? 'ACCÈS AUX PROJETS' : 'PROJECT ACCESS'}</Text>
                <View style={[styles.optionsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {projects.map((project, idx) => (
                    <TouchableOpacity 
                      key={project.id} 
                      onPress={() => handleProjectToggle(project.id)}
                      style={[
                        styles.optionRow, 
                        idx < projects.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionLabel, { color: colors.text }]}>{project.name}</Text>
                      </View>
                      {allowedProjects.includes(project.id) && (
                        <Check size={18} color={primaryColor} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {projects.length === 0 && (
                    <View style={styles.emptyRow}>
                      <Text style={[styles.emptyText, { color: colors.textMuted }]}>{lang === 'fr' ? 'Aucun projet disponible' : 'No projects available'}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom + 30, 60) }]}>
            <Button 
              title={t('close')} 
              variant="outline" 
              onPress={onClose} 
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.h3,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: spacing.md,
    opacity: 0.6,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleName: {
    fontWeight: '700',
    fontSize: 15,
  },
  roleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  optionsContainer: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: 56,
  },
  optionLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
  emptyRow: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  }
});
