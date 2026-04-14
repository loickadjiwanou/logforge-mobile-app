import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Animated, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Info, AlertTriangle, XCircle, Bug, ChevronRight, Hash, FolderKanban, Search, X, RefreshCw } from 'lucide-react-native';
import api from '../../../src/lib/api';
import { useTheme } from '../../../src/context/ThemeContext';
import { useLanguage } from '../../../src/context/LanguageContext';
import { spacing, radius, typography } from '../../../src/theme';
import { AnimatedHeader } from '../../../src/components/navigation/AnimatedHeader';
import { LogLoader } from '../../../src/components/ui/LogLoader';
import { Input } from '../../../src/components/ui/Input';
import { Select } from '../../../src/components/ui/Select';
import { Button } from '../../../src/components/ui/Button';

const LEVEL_ICONS = {
  info: <Info size={16} color="#3b82f6" />,
  warning: <AlertTriangle size={16} color="#f59e0b" />,
  error: <XCircle size={16} color="#ef4444" />,
  critical: <XCircle size={16} color="#b91c1c" />,
  debug: <Bug size={16} color="#6b7280" />
};

export default function ProjectLogsScreen() {
  const { projectId, projectName } = useLocalSearchParams();
  const router = useRouter();
  const { colors, primaryColor } = useTheme();
  const { t, lang } = useLanguage();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [project, setProject] = useState(null);
  const [channels, setChannels] = useState([]);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
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

  const [filters, setFilters] = useState({
    level: 'all', channel: 'all', environment: 'all', search: '', date_from: '', date_to: ''
  });
  const [searchText, setSearchText] = useState('');

  const loadMeta = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get('/channels/', { params: { project_id: projectId } })
      ]);
      setProject(pRes.data);
      setChannels(cRes.data.channels || []);
    } catch (e) {
      console.log('Failed to load project meta', e);
    }
  };

  const fetchLogs = useCallback(async (pageNum = 1, isRefresh = false) => {
    // Only set loading(true) if it's not a header-icon refresh (which has its own spinner)
    if (!refreshing) setLoading(true);
    try {
      const params = { page: pageNum, size: 30, project_id: projectId };
      if (filters.search) params.search = filters.search;
      if (filters.level && filters.level !== 'all') params.level = filters.level;
      if (filters.channel && filters.channel !== 'all') params.channel = filters.channel;
      if (filters.environment && filters.environment !== 'all') params.environment = filters.environment;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const res = await api.get('/logs', { params });
      const newLogs = res.data.logs || [];
      if (isRefresh) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }
      setTotal(res.data.total || 0);
      setHasMore(newLogs.length === 30);
    } catch (e) {
      console.log('Failed to fetch logs', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      stopSpin();
    }
  }, [projectId, filters]);

  useEffect(() => {
    // Reset state before loading new data to avoid "ghosting" previous project
    setLogs([]);
    setProject(null);
    setLoading(true);
    setPage(1);
    
    // Initial fetch for the new project
    loadMeta();
    fetchLogs(1, true);
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    startSpin();
    setPage(1);
    // Ensure animation runs for at least 1s
    const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
    Promise.all([fetchLogs(1, true), minDelay]).finally(() => {
      // fetchLogs calls stopSpin in finally
    });
  };

  const loadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLogs(nextPage);
    }
  };

  const updateFilter = (k, v) => {
    setFilters(prev => ({ ...prev, [k]: v }));
  };

  useFocusEffect(
    useCallback(() => {
      // Refresh logs when screen is focused (to handle additions or deletions)
      // We skip the very first mount fetch if we want to avoid double-firing with useEffect,
      // but since we want to refresh on EVERY focus, we can just use this.
      fetchLogs(1, true);
    }, [fetchLogs])
  );

  const clearFilters = () => {
    setSearchText('');
    setFilters({ level: 'all', channel: 'all', environment: 'all', search: '', date_from: '', date_to: '' });
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchText }));
  };

  const hasActiveFilters = filters.search || filters.level !== 'all' || filters.channel !== 'all' || filters.environment !== 'all' || filters.date_from || filters.date_to;

  const headerContent = React.useMemo(() => (
    <View style={styles.headerContainer}>
      {/* Project Meta */}
      <View style={styles.metaBox}>
        <View style={styles.metaRow}>
          <FolderKanban size={24} color={primaryColor} />
          <View style={{ marginLeft: spacing.sm }}>
            <Text style={[styles.metaTitle, { color: colors.text }]}>{project ? project.name : projectName}</Text>
            {project?.environment && (
              <View style={[styles.envBadge, { borderColor: primaryColor }]}>
                <Text style={[styles.envBadgeText, { color: primaryColor }]}>{project.environment.toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>
        {project?.description ? <Text style={[styles.metaDesc, { color: colors.textMuted }]}>{project.description}</Text> : null}
        <Text style={[styles.metaCount, { color: colors.textMuted }]}>{total.toLocaleString()} {t('eventsFound')}</Text>
      </View>

      {/* Filters UI */}
      <View style={[styles.filtersBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.searchRow}>
          <Input 
            placeholder={t('searchLogs')} 
            value={searchText} 
            onChangeText={(t) => {
              setSearchText(t);
              if (t === '') setFilters(prev => ({ ...prev, search: '' }));
            }} 
            onSubmitEditing={handleSearch}
            containerStyle={styles.searchBox} 
            style={{ height: 48, paddingVertical: 0 }}
          />
          <TouchableOpacity 
            onPress={handleSearch}
            style={[styles.searchBtn, { backgroundColor: primaryColor, height: 48 }]}
          >
            <Search size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.selectRow}>
          <Select
            placeholder={t('level')}
            value={filters.level}
            onSelect={v => updateFilter('level', v)}
            options={[
              { label: t('allLevels'), value: 'all' },
              { label: 'DEBUG', value: 'debug' },
              { label: 'INFO', value: 'info' },
              { label: 'WARNING', value: 'warning' },
              { label: 'ERROR', value: 'error' },
              { label: 'CRITICAL', value: 'critical' },
            ]}
            containerStyle={styles.halfWidth}
          />
          <Select
            placeholder={t('environment')}
            value={filters.environment}
            onSelect={v => updateFilter('environment', v)}
            options={[
              { label: t('allEnvs'), value: 'all' },
              { label: 'Production', value: 'production' },
              { label: 'Staging', value: 'staging' },
              { label: 'Development', value: 'development' },
            ]}
            containerStyle={styles.halfWidth}
          />
        </View>

        <View style={styles.selectRow}>
          <Select
            placeholder={t('channel')}
            value={filters.channel}
            onSelect={v => updateFilter('channel', v)}
            options={[
              { label: t('allChannels'), value: 'all' },
              ...channels.map(c => ({ label: c.name, value: c.name }))
            ]}
            containerStyle={styles.fullWidth}
          />
        </View>

        <View style={styles.dateRow}>
          <Input 
            placeholder="From (YYYY-MM-DD)" 
            value={filters.date_from} 
            onChangeText={t => updateFilter('date_from', t)} 
            containerStyle={styles.halfWidth} 
          />
          <Input 
            placeholder="To (YYYY-MM-DD)" 
            value={filters.date_to} 
            onChangeText={t => updateFilter('date_to', t)} 
            containerStyle={styles.halfWidth} 
          />
        </View>

        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
            <X size={14} color={colors.textMuted} />
            <Text style={[styles.clearBtnText, { color: colors.textMuted }]}>{t('clear') || 'Clear Filters'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  ), [project, projectName, channels, total, filters, colors, primaryColor, searchText]);

  const renderLogItem = ({ item }) => {
    const timestamp = item.timestamp ? new Date(item.timestamp) : new Date();
    const formattedTime = `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;
    return (
      <TouchableOpacity 
        style={[styles.logItem, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: '/(main)/(stack)/log-detail', params: { logId: item.id } })}
      >
        <View style={styles.logHeader}>
          <View style={styles.logLevelBadge}>
            {LEVEL_ICONS[item.level] || LEVEL_ICONS.info}
            <Text style={[styles.logLevelText, { color: colors.textMuted }]}>{item.level.toUpperCase()}</Text>
          </View>
          <Text style={[styles.logTime, { color: colors.textMuted }]}>{formattedTime}</Text>
        </View>
        <Text style={[styles.logMessage, { color: colors.text }]} numberOfLines={3}>
          {item.message}
        </Text>
        <View style={styles.logFooter}>
          <View style={styles.logMetaTag}>
            <Hash size={12} color={colors.textMuted} />
            <Text style={[styles.logChannel, { color: colors.textMuted }]}>{item.channel || 'default'}</Text>
          </View>
          {item.environment && (
            <View style={styles.logMetaTag}>
              <Text style={[styles.logChannel, { color: colors.textMuted }]}>{item.environment}</Text>
            </View>
          )}
          <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </View>
      </TouchableOpacity>
    );
  };



  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader 
        scrollY={scrollY} 
        title={`${project?.name || projectName || 'Project'} Logs`} 
        showBack={true}
        rightElement={
          <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <RefreshCw size={20} color={colors.text} />
            </Animated.View>
          </TouchableOpacity>
        }
      />
      <Animated.FlatList
        data={logs}
        keyExtractor={item => item.id.toString()}
        renderItem={renderLogItem}
        style={{ opacity: loading && !refreshing ? 0.6 : 1 }}
        ListHeaderComponent={
          <View>
            <View style={styles.headerSpacer} />
            {headerContent}
          </View>
        }
        contentContainerStyle={styles.listContent}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <LogLoader text={t('loading')} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No logs found matching your filters.</Text>
            </View>
          )
        }
        ListFooterComponent={
          loading && logs.length > 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <LogLoader text="Loading..." />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: spacing.xxl * 2 },
  headerSpacer: { height: Platform.OS === 'ios' ? 140 : 120 },
  headerContainer: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  metaBox: { marginBottom: spacing.md, marginTop: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  metaTitle: { ...typography.h3, fontWeight: '700' },
  envBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  envBadgeText: { fontSize: 9, fontWeight: '800', ...Platform.select({ ios: { fontFamily: 'Courier' }, android: { fontFamily: 'monospace' } }) },
  metaDesc: { fontSize: 13, marginTop: spacing.xs },
  metaCount: { fontSize: 11, marginTop: spacing.sm, fontWeight: '600' },
  filtersBox: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1, top: 12 },
  searchBox: { flex: 1, marginBottom: 0 },
  searchBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: radius.md, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: spacing.sm
  },
  selectRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  halfWidth: { flex: 1, marginBottom: 0 },
  fullWidth: { flex: 1, marginBottom: 0 },
  dateRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  clearBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4, marginTop: spacing.xs, padding: 4 },
  clearBtnText: { fontSize: 12, fontWeight: '600' },
  logItem: { marginHorizontal: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, marginBottom: spacing.sm },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  logLevelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logLevelText: { fontSize: 10, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  logTime: { fontSize: 10 },
  logMessage: { fontSize: 13, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: spacing.sm },
  logFooter: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
  logMetaTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  logChannel: { fontSize: 10, fontWeight: '600' },
  emptyState: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  emptyText: { fontSize: 14 },
  iconBtn: { padding: 8 },
});
