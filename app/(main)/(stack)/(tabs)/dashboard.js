import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, RefreshControl, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Activity, AlertTriangle, Bug, ShieldAlert, Clock, Layers, Hash, BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import api, { WS_URL } from '../../../../src/lib/api';
import { useAuth } from '../../../../src/context/AuthContext';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { spacing, radius, typography } from '../../../../src/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../src/components/ui/Card';
import { AnimatedHeader } from '../../../../src/components/navigation/AnimatedHeader';

const screenWidth = Dimensions.get('window').width;

const CHART_COLORS = {
  critical: '#dc2626',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  debug: '#71717a',
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, primaryColor, isDark } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  
  const [stats, setStats] = useState({ total: 0, by_level: {}, timeline: [], by_project: {} });
  const [recentLogs, setRecentLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [channels, setChannels] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, logsRes, projectsRes, channelsRes] = await Promise.all([
        api.get('/logs/stats'),
        api.get('/logs', { params: { size: 20 } }),
        api.get('/projects/'),
        api.get('/channels/')
      ]);
      setStats(statsRes.data);
      setRecentLogs(logsRes.data.logs || []);
      setProjects(projectsRes.data.projects || []);
      setChannels(channelsRes.data.channels || []);
    } catch (err) {
      console.log('Failed to fetch dashboard data', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const statCards = [
    { label: t('totalEvents'), value: stats.total, icon: Activity, color: isDark ? '#fff' : primaryColor },
    { label: t('critical'), value: stats.by_level?.critical || 0, icon: ShieldAlert, color: CHART_COLORS.critical },
    { label: t('errors'), value: stats.by_level?.error || 0, icon: Bug, color: CHART_COLORS.error },
    { label: t('warnings'), value: stats.by_level?.warning || 0, icon: AlertTriangle, color: CHART_COLORS.warning },
  ];

  const timelineDataCount = (stats.timeline || []).map(t => ({
    value: t.count || 0,
    label: t.hour ? t.hour.slice(11, 16) : ''
  }));

  const timelineDataErrors = (stats.timeline || []).map(t => ({ value: t.errors || 0 }));

  const levelData = Object.entries(stats.by_level || {}).map(([name, value]) => ({
    value, label: name, frontColor: CHART_COLORS[name] || '#71717a'
  })).sort((a, b) => b.value - a.value);

  const projectData = Object.entries(stats.by_project || {}).map(([name, value]) => ({
    value, label: name.substring(0, 8), frontColor: primaryColor
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader scrollY={scrollY} title={t('dashboard')} />
      
      <Animated.ScrollView 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
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
        
        <View style={styles.badgesContainer}>
          <View style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Layers size={14} color="#60a5fa" />
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>{projects.length} {t('projectsUpper')}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Hash size={14} color="#c084fc" />
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>{channels.length} {t('channelsUpper')}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          {statCards.map((card, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <card.icon size={24} color={card.color} style={styles.statIconBg} />
              <View style={styles.statContent}>
                <View>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{card.label}</Text>
                  <Text style={[styles.statValue, { color: card.color }]}>{(card.value || 0).toLocaleString()}</Text>
                </View>
                <View style={[styles.iconWrapper, { borderColor: card.color + '40', backgroundColor: colors.background }]}>
                  <card.icon size={20} color={card.color} />
                </View>
              </View>
            </View>
          ))}
        </View>

        <Card style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CardHeader>
            <CardTitle style={{ fontSize: 13, color: colors.textMuted, flexDirection: 'row', alignItems: 'center' }}>
              <TrendingUp size={16} color="#10b981" style={{ marginRight: 6 }} /> {t('ingestionActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent style={{ paddingBottom: 0, paddingLeft: 0 }}>
            {timelineDataCount.length > 0 ? (
              <LineChart
                data={timelineDataCount}
                data2={timelineDataErrors}
                color1="#10b981"
                color2="#ef4444"
                dataPointsColor1="#10b981"
                dataPointsColor2="#ef4444"
                hideDataPoints={true}
                areaChart
                startFillColor1="#10b981"
                startFillColor2="#ef4444"
                startOpacity1={0.3}
                startOpacity2={0.3}
                endOpacity1={0.05}
                endOpacity2={0.05}
                rulesColor={colors.border}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, rotation: 45 }}
                spacing={Math.max((screenWidth - 80) / Math.max(timelineDataCount.length, 1), 30)}
                height={200}
              />
            ) : (
              <Text style={[styles.noData, { color: colors.textMuted }]}>{t('noActivityData')}</Text>
            )}
          </CardContent>
        </Card>

        <Card style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CardHeader><CardTitle style={{ fontSize: 13, color: colors.textMuted }}>{t('realTimeFeed')}</CardTitle></CardHeader>
          <CardContent>
            {recentLogs.length > 0 ? (
              recentLogs.slice(0, 5).map((log, idx) => (
                <TouchableOpacity 
                  key={log.id} 
                  style={[styles.feedItem, idx !== 0 && { borderTopColor: colors.border, borderTopWidth: 1 }]}
                  onPress={() => router.push({ pathname: '/(main)/(stack)/log-detail', params: { logId: log.id } })}
                >
                  <View style={[styles.feedIndicator, { backgroundColor: CHART_COLORS[log.level] || CHART_COLORS.debug }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.feedMessage, { color: colors.text }]} numberOfLines={1}>{log.message}</Text>
                    <View style={styles.feedMeta}>
                      <Text style={[styles.feedProject, { color: colors.textMuted, backgroundColor: colors.background, borderColor: colors.border }]}>{log.project_name}</Text>
                      <Text style={[styles.feedChannel, { color: colors.textMuted }]}>@{log.channel}</Text>
                      <Text style={[styles.feedTime, { color: colors.textMuted }]}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.noData, { color: colors.textMuted }]}>{t('awaitingLogs')}</Text>
            )}
          </CardContent>
        </Card>

        <View style={styles.chartGrid}>
          <Card style={[styles.sectionHalf, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CardHeader><CardTitle style={{ fontSize: 11, color: colors.textMuted }}>{t('distribution')}</CardTitle></CardHeader>
            <CardContent style={{ paddingLeft: 0 }}>
              <BarChart data={levelData} barWidth={10} spacing={12} roundedTop xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 8 }} yAxisTextStyle={{ color: colors.textMuted, fontSize: 8 }} rulesColor={colors.border} yAxisColor={colors.border} xAxisColor={colors.border} height={100} hideRules />
            </CardContent>
          </Card>
          <Card style={[styles.sectionHalf, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <CardHeader><CardTitle style={{ fontSize: 11, color: colors.textMuted }}>{t('load')}</CardTitle></CardHeader>
            <CardContent style={{ paddingLeft: 0 }}>
              <BarChart data={projectData} barWidth={10} spacing={12} roundedTop xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 8 }} yAxisTextStyle={{ color: colors.textMuted, fontSize: 8 }} rulesColor={colors.border} yAxisColor={colors.border} xAxisColor={colors.border} height={100} hideRules />
            </CardContent>
          </Card>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerSpacer: { height: Platform.OS === 'ios' ? 140 : 120 },
  badgesContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: spacing.md, gap: spacing.md, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, gap: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm, justifyContent: 'space-between' },
  statCard: { width: '48%', borderRadius: radius.md, borderWidth: 1, padding: spacing.md, overflow: 'hidden', marginBottom: spacing.sm },
  statIconBg: { position: 'absolute', right: -10, top: -10, opacity: 0.05, transform: [{ scale: 3 }] },
  statContent: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  statLabel: { fontSize: 10, fontWeight: 'bold' },
  statValue: { ...typography.h3, marginTop: 4, fontWeight: '700' },
  iconWrapper: { padding: 6, borderRadius: radius.md, borderWidth: 1 },
  section: { margin: spacing.md },
  chartGrid: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.xxl },
  sectionHalf: { flex: 1 },
  noData: { textAlign: 'center', paddingVertical: spacing.xl, fontSize: 12 },
  feedItem: { flexDirection: 'row', paddingVertical: spacing.md },
  feedIndicator: { width: 4, height: 14, borderRadius: 2, marginTop: 2, marginRight: spacing.sm },
  feedMessage: { fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  feedMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  feedProject: { fontSize: 10, paddingHorizontal: 4, paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1 },
  feedChannel: { fontSize: 10 },
  feedTime: { fontSize: 10, marginLeft: 'auto' }
});
