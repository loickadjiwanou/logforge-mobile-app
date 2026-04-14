import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Platform } from 'react-native';
import { Clock, Layers, Hash, Tag, Trash2, Monitor, Cpu, HardDrive, Network, Globe, Mail, Shield, Terminal, Zap, Info, AlertTriangle, XCircle, Bug, PlayCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import api from '../../../src/lib/api';
import { useTheme } from '../../../src/context/ThemeContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { spacing, radius, typography } from '../../../src/theme';
import { AnimatedHeader } from '../../../src/components/navigation/AnimatedHeader';
import { LogLoader } from '../../../src/components/ui/LogLoader';
import { Card, CardContent } from '../../../src/components/ui/Card';

const LEVEL_COLORS = {
  critical: '#b91c1c',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  debug: '#6b7280',
};

const Section = ({ title, icon: Icon, children, colors }) => (
  <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={styles.sectionHeader}>
      <Icon size={14} color={colors.textMuted} />
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
    </View>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const MetadataItem = ({ label, value, icon: Icon, colors }) => {
  if (!value) return null;
  return (
    <View style={[styles.metaItem, { borderBottomColor: colors.border + '40' }]}>
      {Icon && <Icon size={14} color={colors.textMuted} style={styles.metaIcon} />}
      <View>
        <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.metaValue, { color: colors.text }]}>{String(value)}</Text>
      </View>
    </View>
  );
};

export default function LogDetailScreen() {
  const { logId } = useLocalSearchParams();
  const router = useRouter();
  const { colors, primaryColor } = useTheme();
  const { t, lang } = useLanguage();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
      setLoading(true);
      setLog(null);
      try {
        const [res] = await Promise.all([
          api.get(`/logs/${logId}`),
          new Promise(resolve => setTimeout(resolve, 400)) // Artificial breathing room for smooth transition
        ]);
        setLog(res.data);
      } catch (err) {
        console.error('Log not found', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLog();
  }, [logId]);

  const handleDelete = () => {
    Alert.alert(
      lang === 'fr' ? 'Supprimer le Log' : 'Delete Log',
      lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce log ? Cette action est irréversible.' : 'Are you sure you want to delete this log? This action cannot be undone.',
      [
        { text: t('cancel') || (lang === 'fr' ? 'Annuler' : 'Cancel'), style: 'cancel' },
        { 
          text: t('delete') || (lang === 'fr' ? 'Supprimer' : 'Delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/logs/${logId}`);
              router.back();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete log');
            }
          }
        }
      ]
    );
  };



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader 
        scrollY={scrollY} 
        title={t('logDetails') || 'Log Details'} 
        showBack={true}
        rightElement={
          log ? (
            <TouchableOpacity onPress={handleDelete} style={styles.headerIcon}>
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          ) : null
        }
      />
      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scrollContent, (loading || !log) && { flex: 1, justifyContent: 'center', alignItems: 'center' }]}
      >
        <View style={styles.headerSpacer} />
        
        {loading ? (
          <LogLoader text={t('loading')} />
        ) : !log ? (
          <Text style={{ color: colors.textMuted }}>Log not found</Text>
        ) : (
          <View style={styles.content}>
          <View style={[styles.severityBadge, { backgroundColor: (LEVEL_COLORS[log.level] || LEVEL_COLORS.info) + '20', borderColor: (LEVEL_COLORS[log.level] || LEVEL_COLORS.info) + '40' }]}>
            <Text style={[styles.severityText, { color: LEVEL_COLORS[log.level] || LEVEL_COLORS.info }]}>{log.level.toUpperCase()}</Text>
          </View>
          
          <Text style={[styles.message, { color: colors.text }]}>{log.message}</Text>
          
          <View style={styles.mainMeta}>
             <View style={styles.mainMetaItem}>
               <Clock size={12} color={colors.textMuted} />
               <Text style={[styles.mainMetaText, { color: colors.textMuted }]}>{new Date(log.timestamp).toLocaleString()}</Text>
             </View>
             <View style={styles.mainMetaItem}>
               <Layers size={12} color={colors.textMuted} />
               <Text style={[styles.mainMetaText, { color: colors.textMuted }]}>{log.project_name}</Text>
             </View>
             <View style={styles.mainMetaItem}>
               <Hash size={12} color={colors.textMuted} />
               <Text style={[styles.mainMetaText, { color: colors.textMuted }]}>{log.channel}</Text>
             </View>
             {log.environment && (
               <View style={styles.mainMetaItem}>
                 <Text style={[styles.mainMetaText, { color: colors.textMuted }]}>{log.environment}</Text>
               </View>
             )}
          </View>

          {log.has_replay && (
            <Section title="Session Replay" icon={PlayCircle} colors={colors}>
              <TouchableOpacity 
                style={[styles.replayBtn, { backgroundColor: '#10b98120', borderColor: '#10b98140' }]}
                onPress={() => Alert.alert('Session Replay', 'Coming soon to mobile!')}
              >
                <PlayCircle size={16} color="#10b981" />
                <Text style={{ color: '#10b981', fontWeight: '600', marginLeft: 8 }}>View Replay</Text>
              </TouchableOpacity>
            </Section>
          )}

          {log.stack_trace ? (
            <Section title={t('stackTrace')} icon={Terminal} colors={colors}>
              <Text style={[styles.code, { color: colors.text }]}>{log.stack_trace}</Text>
            </Section>
          ) : null}

          {log.ingest_protocol && log.ingest_protocol.startsWith('gelf') && (
            <Section title="GELF Protocol Information" icon={Terminal} colors={colors}>
              <MetadataItem label="Ingest Protocol" value={log.ingest_protocol.toUpperCase()} icon={Zap} colors={colors} />
              <MetadataItem label="GELF Version" value={log.gelf_version} icon={Hash} colors={colors} />
              <MetadataItem label="Source Host" value={log.source_host} icon={Monitor} colors={colors} />
              <MetadataItem label="Syslog Level" value={log.syslog_level} icon={Terminal} colors={colors} />
            </Section>
          )}

          {log.metadata && Object.keys(log.metadata).length > 0 ? (
            <Section title={t('metadata')} icon={Tag} colors={colors}>
              <Text style={[styles.code, { color: colors.text }]}>{JSON.stringify(log.metadata, null, 2)}</Text>
            </Section>
          ) : null}

          {log.user_info && Object.keys(log.user_info).length > 0 ? (
            <Section title={t('userInfo')} icon={Shield} colors={colors}>
              <View style={styles.metaGrid}>
                <MetadataItem label="User ID" value={log.user_info.id || log.user_info.user_id} icon={Shield} colors={colors} />
                <MetadataItem label="Email" value={log.user_info.email} icon={Mail} colors={colors} />
                <MetadataItem label="Name" value={log.user_info.name} icon={Shield} colors={colors} />
                <MetadataItem label="Role" value={log.user_info.role} icon={Shield} colors={colors} />
              </View>
              {Object.keys(log.user_info).some(k => !['id', 'user_id', 'email', 'name', 'role'].includes(k)) && (
                <View style={[styles.jsonDivider, { borderTopColor: colors.border }]}>
                  <Text style={[styles.code, { color: colors.text }]}>
                    {JSON.stringify(Object.fromEntries(Object.entries(log.user_info).filter(([k]) => !['id', 'user_id', 'email', 'name', 'role'].includes(k))), null, 2)}
                  </Text>
                </View>
              )}
            </Section>
          ) : null}

          {log.device_info && Object.keys(log.device_info).length > 0 ? (
            <Section title={t('deviceInfo')} icon={Monitor} colors={colors}>
              <View style={styles.metaGrid}>
                <MetadataItem label="IP Address" value={log.device_info.ip} icon={Network} colors={colors} />
                <MetadataItem label="OS / Platform" value={log.device_info.os || log.device_info.platform} icon={Monitor} colors={colors} />
                <MetadataItem label="CPU cores" value={log.device_info.cpu_cores || log.device_info.cpu} icon={Cpu} colors={colors} />
                <MetadataItem label="Memory" value={log.device_info.memory_total || log.device_info.memory} icon={HardDrive} colors={colors} />
                <MetadataItem label="Language" value={log.device_info.language} icon={Globe} colors={colors} />
                <MetadataItem label="Screen" value={log.device_info.screen} icon={Monitor} colors={colors} />
              </View>
              {Object.keys(log.device_info).some(k => !['ip', 'os', 'platform', 'cpu_cores', 'cpu', 'memory_total', 'memory', 'language', 'screen'].includes(k)) && (
                <View style={[styles.jsonDivider, { borderTopColor: colors.border }]}>
                  <Text style={[styles.code, { color: colors.text }]}>
                    {JSON.stringify(Object.fromEntries(Object.entries(log.device_info).filter(([k]) => !['ip', 'os', 'platform', 'cpu_cores', 'cpu', 'memory_total', 'memory', 'language', 'screen'].includes(k))), null, 2)}
                  </Text>
                </View>
              )}
            </Section>
          ) : null}

          {log.tags && log.tags.length > 0 && (
            <Section title={t('tags')} icon={Tag} colors={colors}>
              <View style={styles.tagContainer}>
                {log.tags.map((tag, i) => (
                  <View key={i} style={[styles.tag, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: colors.textMuted }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {log.grouped_hash && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={{ fontSize: 10, color: colors.textMuted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                ERROR GROUP: {log.grouped_hash}
              </Text>
            </View>
          )}
        </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  headerSpacer: { height: Platform.OS === 'ios' ? 140 : 120 },
  content: { padding: spacing.lg },
  severityBadge: { 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4, 
    borderWidth: 1, 
    marginBottom: spacing.md 
  },
  severityText: { fontSize: 10, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  message: { fontSize: 16, fontWeight: '600', lineHeight: 24, marginBottom: spacing.lg },
  mainMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  mainMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mainMetaText: { fontSize: 12 },
  section: { borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.lg, padding: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  sectionContent: {},
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metaItem: { width: '50%', flexShrink: 0, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  metaIcon: { marginRight: spacing.sm, marginTop: 4 },
  metaLabel: { fontSize: 9, fontWeight: '700', marginBottom: 2 },
  metaValue: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  jsonDivider: { marginTop: spacing.md, pt: spacing.md, borderTopWidth: 1 },
  replayBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1 },
  tagText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  code: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', lineHeight: 16 },
  headerIcon: { padding: 8 },
});
