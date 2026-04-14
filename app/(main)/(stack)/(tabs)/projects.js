import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, RefreshControl, TouchableOpacity, Alert, ScrollView, Modal, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Copy, RefreshCw, Trash2, Edit2, Key, FolderKanban, List, ChevronRight, Hash, Activity } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../../../src/context/AuthContext';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { spacing, radius, typography } from '../../../../src/theme';
import { Button } from '../../../../src/components/ui/Button';
import { Input } from '../../../../src/components/ui/Input';
import { Select } from '../../../../src/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../src/components/ui/Card';
import { AnimatedHeader } from '../../../../src/components/navigation/AnimatedHeader';
import { LogLoader } from '../../../../src/components/ui/LogLoader';
import api from '../../../../src/lib/api';

export default function ProjectsScreen() {
  const { colors, primaryColor } = useTheme();
  const { t, lang } = useLanguage();
  const { user, isAdmin, hasPermission } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editEnvironment, setEditEnvironment] = useState('production');
  const [showEditModal, setShowEditModal] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  const startSpin = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: (t) => t, // Linear
        useNativeDriver: true,
      })
    ).start();
  };

  const stopSpin = () => {
    spinValue.stopAnimation((currentValue) => {
      // Find how much is left to reach a full rotation (1)
      const remaining = 1 - currentValue;
      Animated.timing(spinValue, {
        toValue: 1,
        duration: remaining * 500, // proportional duration
        useNativeDriver: true,
      }).start(() => spinValue.setValue(0));
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects/', { params: { page: 1, size: 100 } });
      let filteredProjects = res.data.projects || [];
      
      // Enforce RBAC filtering for non-admins
      if (!isAdmin) {
        const allowed = user.allowed_projects || [];
        filteredProjects = filteredProjects.filter(p => allowed.includes(p.id));
      }
      
      setProjects(filteredProjects);
    } catch (e) {
      console.log('Failed to fetch projects', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      stopSpin();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    startSpin();
    // Ensure animation runs for at least 1s
    const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
    Promise.all([fetchProjects(), minDelay]).finally(() => {
      // fetchProjects calls stopSpin in finally
    });
  };

  const copyKey = async (key) => {
    await Clipboard.setStringAsync(key);
    Alert.alert('Success', t('apiKeyCopied'));
  };

  const handleRegenKey = (id) => {
    Alert.alert(
      t('regenerateKey'),
      t('regenerateKeyDesc'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('regenerate'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/projects/${id}/regenerate-key`);
              fetchProjects();
            } catch (e) { Alert.alert('Error', 'Failed to regenerate key'); }
          }
        }
      ]
    );
  };

  const handleDelete = (id) => {
    if (!hasPermission('delete_projects')) return;
    Alert.alert(
      t('deleteProject'),
      t('deleteProjectDesc'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/projects/${id}`);
              fetchProjects();
            } catch (e) { Alert.alert('Error', 'Failed to delete project'); }
          }
        }
      ]
    );
  };

  const handleEditOpen = (project) => {
    if (project) {
      setEditProject(project);
      setEditName(project.name || '');
      setEditDescription(project.description || '');
      setEditEnvironment(project.environment || 'production');
    } else {
      setEditProject(null);
      setEditName('');
      setEditDescription('');
      setEditEnvironment('production');
    }
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editName.trim()) {
      Alert.alert(
        lang === 'fr' ? 'Champ requis' : 'Required Field',
        lang === 'fr' ? 'Le nom du projet est obligatoire.' : 'The project name is required.'
      );
      return;
    }
    setSaving(true);
    try {
      if (editProject) {
        await api.put(`/projects/${editProject.id}`, { name: editName, description: editDescription, environment: editEnvironment });
      } else {
        await api.post('/projects/', { name: editName, description: editDescription, environment: editEnvironment });
      }
      setShowEditModal(false);
      fetchProjects();
    } catch (e) {
      Alert.alert('Error', 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const ProjectCard = ({ project }) => (
    <Card style={styles.projectCard}>
      <TouchableOpacity 
        onPress={() => router.push({ pathname: '/(main)/(stack)/project-logs', params: { projectId: project.id, projectName: project.name } })}
        activeOpacity={0.7}
      >
        <CardHeader style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
              <View style={[styles.envBadge, { borderColor: primaryColor + '40', backgroundColor: primaryColor + '10' }]}>
                <Text style={[styles.envBadgeText, { color: primaryColor }]}>{project.environment.toUpperCase()}</Text>
              </View>
            </View>
            {project.description ? (
              <Text style={[styles.description, { color: colors.textMuted, marginTop: 4 }]} numberOfLines={1}>
                {project.description}
              </Text>
            ) : null}
          </View>
          <View style={styles.cardActions}>
            {isAdmin && (
              <TouchableOpacity onPress={() => handleEditOpen(project)} style={styles.iconBtn}>
                <Edit2 size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            {hasPermission('delete_projects') && (
              <TouchableOpacity onPress={() => handleDelete(project.id)} style={styles.iconBtn}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </CardHeader>
        
        <CardContent>
          <View style={[styles.keyContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Key size={14} color={colors.textMuted} />
            <Text style={[styles.keyText, { color: colors.textMuted }]} numberOfLines={1} ellipsizeMode="middle">
              {project.api_key}
            </Text>
            <TouchableOpacity onPress={() => copyKey(project.api_key)} style={styles.keyAction}>
              <Copy size={14} color={primaryColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRegenKey(project.id)} style={styles.keyAction}>
              <RefreshCw size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
  
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Hash size={12} color={colors.textMuted} />
              <Text style={[styles.statValue, { color: colors.text }]}>{project.total_logs || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Logs</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Activity size={12} color="#ef4444" />
              <Text style={[styles.statValue, { color: colors.text }]}>{project.error_count || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Errors</Text>
            </View>
          </View>
        </CardContent>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <LogLoader text={t('loading')} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader 
        scrollY={scrollY} 
        title={t('projects')} 
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <RefreshCw size={20} color={colors.text} />
              </Animated.View>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity 
                onPress={() => handleEditOpen(null)}
                style={[styles.addButton, { backgroundColor: primaryColor }]}
              >
                <Plus size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      <Animated.ScrollView 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSpacer} />
        
        <View style={styles.headerInfo}>
          <Text style={[styles.subtitle, { color: colors.textMuted, marginTop: 4 }]}>
            {t('projectsDesc')}
          </Text>
        </View>

        <View style={styles.content}>
          {projects.length === 0 ? (
            <View style={styles.emptyState}>
              <FolderKanban size={64} color={colors.border} strokeWidth={1} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t('noProjects')}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                {isAdmin ? t('noProjectsAdminDesc') : t('noProjectsMemberDesc')}
              </Text>
              {isAdmin && (
                <Button 
                  title={t('newProject')} 
                  onPress={() => handleEditOpen(null)} 
                  style={{ marginTop: spacing.xl, backgroundColor: primaryColor, paddingHorizontal: 30 }} 
                />
              )}
            </View>
          ) : (
            projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </View>
      </Animated.ScrollView>

      {/* Edit Project Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editProject ? t('editProject') : t('newProject')}
            </Text>
            
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('projectName')}</Text>
            <Input
              value={editName}
              onChangeText={setEditName}
              placeholder={t('projectName')}
              containerStyle={{ marginBottom: spacing.md }}
            />
            
            <Text style={[styles.modalLabel, { color: colors.textMuted }]}>{t('description')}</Text>
            <Input
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder={t('description')}
              containerStyle={{ marginBottom: spacing.md }}
            />

            <Select
              label={t('environment')}
              value={editEnvironment}
              onSelect={setEditEnvironment}
              options={[
                { label: 'Production', value: 'production' },
                { label: 'Staging', value: 'staging' },
                { label: 'Development', value: 'development' }
              ]}
              containerStyle={{ marginBottom: spacing.lg }}
            />
            
            <View style={styles.modalActions}>
              <Button 
                title={t('cancel')} 
                variant="outline" 
                onPress={() => setShowEditModal(false)} 
                style={{ flex: 1, marginRight: spacing.sm }} 
              />
              <Button 
                title={t('save')} 
                onPress={handleEditSave} 
                loading={saving}
                style={{ flex: 1, backgroundColor: primaryColor }} 
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerSpacer: { height: Platform.OS === 'ios' ? 140 : 120 },
  headerInfo: { paddingHorizontal: 20, marginBottom: spacing.sm },
  subtitle: { ...typography.bodySmall },
  content: { padding: 20 },
  projectCard: { marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingBottom: spacing.sm },
  projectName: { fontSize: 18, fontWeight: '700' },
  envBadge: { 
    borderWidth: 1, 
    paddingHorizontal: 6, 
    paddingVertical: 1, 
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  envBadgeText: { 
    fontSize: 9, 
    fontWeight: '800', 
    letterSpacing: 0.5 
  },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginLeft: 'auto' },
  iconBtn: { padding: 4 },
  description: { fontSize: 13, lineHeight: 18 },
  keyContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 8, 
    borderRadius: radius.md, 
    borderWidth: 1,
    gap: 8,
    marginBottom: spacing.md,
    marginTop: spacing.md
  },
  keyText: { flex: 1, fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  keyAction: { padding: 4 },
  statsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.lg,
    marginTop: spacing.xs
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, height: 12 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 60,
    paddingHorizontal: 40,
    textAlign: 'center'
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: spacing.lg },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { padding: spacing.xl, borderRadius: radius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  modalTitle: { ...typography.h3, marginBottom: spacing.lg },
  modalLabel: { fontSize: 13, marginBottom: spacing.xs, fontWeight: '500' },
  modalActions: { flexDirection: 'row', marginTop: spacing.md },
});
