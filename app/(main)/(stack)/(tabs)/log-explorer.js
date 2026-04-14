import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Platform, RefreshControl, TouchableOpacity, FlatList, TextInput, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, Filter, RefreshCw, ChevronRight, Calendar, X, Zap } from 'lucide-react-native';
import { useAuth } from '../../../../src/context/AuthContext';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { spacing, radius, typography } from '../../../../src/theme';
import { AnimatedHeader } from '../../../../src/components/navigation/AnimatedHeader';
import { LogLoader } from '../../../../src/components/ui/LogLoader';
import { Badge } from '../../../../src/components/ui/Badge';
import { Card } from '../../../../src/components/ui/Card';
import api, { WS_URL } from '../../../../src/lib/api';
import { format, parseISO } from 'date-fns';

const LEVEL_COLORS = {
  critical: '#ef4444',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
  debug: '#9ca3af',
};

export default function LogExplorerScreen() {
  const { colors, primaryColor } = useTheme();
  const { t, lang } = useLanguage();
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [isLive, setIsLive] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const ws = useRef(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  const startSpin = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: (t) => t,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopSpin = () => {
    spinValue.stopAnimation((currentValue) => {
      const remaining = 1 - currentValue;
      Animated.timing(spinValue, {
        toValue: 1,
        duration: remaining * 500,
        useNativeDriver: true,
      }).start(() => spinValue.setValue(0));
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    fetchLogs();
    setupWebSocket();
    return () => {
      if (ws.current) ws.current.close();
    };
  }, [filterLevel]); // Re-fetch when level filter changes

  const setupWebSocket = () => {
    if (!isLive) return;
    
    const url = `${WS_URL}/ws/global`;
    ws.current = new WebSocket(url);

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'log') {
          // Check RBAC if not admin
          if (!isAdmin) {
            const allowed = user.allowed_projects || [];
            if (!allowed.includes(data.log.project_id)) return;
          }
          
          setLogs(prev => [data.log, ...prev].slice(0, 200));
        }
      } catch (err) { console.log('WS Error', err); }
    };

    ws.current.onclose = () => {
      if (isLive) setTimeout(setupWebSocket, 3000); // Reconnect
    };
  };

  const fetchLogs = async (searchOverride = null, pageNum = 1) => {
    if (pageNum === 1) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentSearch = searchOverride !== null ? searchOverride : search;
      const params = { page: pageNum, size: 50 };
      if (filterLevel !== 'all') params.level = filterLevel;
      if (currentSearch) params.search = currentSearch;
      
      const res = await api.get('/logs', { params });
      const newLogs = res.data.logs || [];
      const resTotal = res.data.total || 0;
      
      setTotal(resTotal);
      setHasMore(newLogs.length === 50);
      
      if (pageNum === 1) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }
    } catch (e) {
      console.log('Failed to fetch logs', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      stopSpin();
    }
  };

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLogs(null, nextPage);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    startSpin();
    fetchLogs();
  };

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [])
  );

  const LogItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.logRow, { borderBottomColor: colors.border }]} 
      onPress={() => router.push({
        pathname: '/(main)/(stack)/log-detail',
        params: { logId: item.id }
      })}
    >
      <View style={[styles.levelIndicator, { backgroundColor: LEVEL_COLORS[item.level] || LEVEL_COLORS.info }]} />
      <View style={styles.logContent}>
        <View style={styles.logMeta}>
          <Text style={[styles.projectLabel, { color: primaryColor }]}>{item.project_name}</Text>
        </View>
        <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
          {item.message}
        </Text>
        <View style={styles.tagRow}>
          <Text style={[styles.timeLabel, { color: colors.textMuted, marginRight: 8 }]}>
            {item.timestamp ? format(parseISO(item.timestamp), 'HH:mm:ss') : ''}
          </Text>
          <View style={[styles.levelBadge, { backgroundColor: (LEVEL_COLORS[item.level] || LEVEL_COLORS.info) + '20' }]}>
            <Text style={[styles.levelBadgeText, { color: LEVEL_COLORS[item.level] || LEVEL_COLORS.info }]}>{item.level.toUpperCase()}</Text>
          </View>
          <Badge text={item.channel} size="small" variant="outline" />
          <Badge text={item.environment} size="small" variant="secondary" />
        </View>
      </View>
      <ChevronRight size={16} color={colors.border} />
    </TouchableOpacity>
  );

  const logHeader = React.useMemo(() => (
    <View>
      <View style={styles.headerSpacer} />
      <View style={styles.filterSection}>
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              placeholder={t('searchLogs')}
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              value={search}
              onChangeText={(val) => {
                setSearch(val);
                if (val === '') fetchLogs('');
              }}
              onSubmitEditing={fetchLogs}
            />
            {search ? (
              <TouchableOpacity onPress={() => { setSearch(''); fetchLogs(''); }} style={styles.clearBtn}>
                <X size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity 
            onPress={fetchLogs}
            style={[styles.searchBtn, { backgroundColor: primaryColor }]}
          >
            <Search size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelFilters}>
          {['all', 'debug', 'info', 'warning', 'error', 'critical'].map(lvl => (
            <TouchableOpacity 
              key={lvl} 
              onPress={() => setFilterLevel(lvl)}
              style={[
                styles.levelTab, 
                { borderColor: colors.border },
                filterLevel === lvl && { backgroundColor: primaryColor, borderColor: primaryColor }
              ]}
            >
              <Text style={[styles.levelTabText, { color: filterLevel === lvl ? '#fff' : colors.textMuted }]}>
                {lvl.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {loading && logs.length > 0 && (
          <View style={{ marginTop: spacing.sm, alignItems: 'center' }}>
            <LogLoader text={t('searchingLogs')} size="small" />
          </View>
        )}
        {total > 0 && (
          <Text style={[styles.totalText, { color: colors.textMuted }]}>
            {total.toLocaleString()} {t('eventsFound')}
          </Text>
        )}
      </View>
    </View>
  ), [search, filterLevel, loading, logs.length, total, colors, primaryColor, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader 
        scrollY={scrollY} 
        title={t('logExplorer')} 
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <RefreshCw size={20} color={colors.text} />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setIsLive(!isLive)}
              style={[styles.liveToggle, { borderColor: isLive ? primaryColor : colors.border }]}
            >
              <Zap size={14} color={isLive ? primaryColor : colors.textMuted} fill={isLive ? primaryColor : 'transparent'} />
              <Text style={[styles.liveText, { color: isLive ? primaryColor : colors.textMuted }]}>{isLive ? 'LIVE' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>
        }
      />
      

        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LogItem item={item} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={logHeader}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            loadingMore ? (
              <View style={styles.footerLoader}>
                <LogLoader size="small" />
              </View>
            ) : null
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              {loading ? (
                <LogLoader text={t('searchingLogs')} />
              ) : (
                <Text style={{ color: colors.textMuted }}>{t('noLogsFound')}</Text>
              )}
            </View>
          )}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSpacer: { height: Platform.OS === 'ios' ? 140 : 120 },
  listContent: { paddingBottom: 100 },
  logRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: spacing.md, 
    borderBottomWidth: 1,
    gap: spacing.md
  },
  levelIndicator: { 
    width: 4, 
    height: '100%', 
    borderRadius: 2, 
    minHeight: 40 
  },
  logContent: { flex: 1, gap: 4 },
  logMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  timeLabel: { fontSize: 10, fontWeight: '500' },
  message: { fontSize: 13, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  levelBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  levelBadgeText: { fontSize: 8, fontWeight: '900' },
  filterSection: { 
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    paddingTop: 10,
    paddingBottom: 8
  },
  searchBar: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    height: 48, 
    borderRadius: radius.md, 
    borderWidth: 1,
    gap: 8,
    flex: 1
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  searchBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: radius.md,
    alignItems: 'center', 
    justifyContent: 'center'
  },
  clearBtn: { padding: 4 },
  levelFilters: { paddingVertical: 12, gap: 8 },
  levelTab: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1 
  },
  levelTabText: { fontSize: 10, fontWeight: '800' },
  liveToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    borderWidth: 1,
    marginRight: 0
  },
  liveText: { fontSize: 10, fontWeight: '900' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { padding: 40, alignItems: 'center' },
  iconBtn: { padding: 4 },
  totalText: { fontSize: 11, fontWeight: '700', color: '#666', marginTop: 8, textAlign: 'center' },
  footerLoader: { paddingVertical: 20 },
});
