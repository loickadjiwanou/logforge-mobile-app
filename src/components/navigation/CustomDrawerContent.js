import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { 
  LayoutDashboard, Search, FolderKanban, Hash, 
  BookOpen, Settings, LogOut, Shield, Layers,
  HelpCircle, ChevronRight
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { spacing, radius, typography } from '../../theme';
import { useRouter } from 'expo-router';

export default function CustomDrawerContent(props) {
  const { user, isAdmin } = useAuth();
  const { colors, primaryColor, isDark } = useTheme();
  const { t, lang } = useLanguage();
  const router = useRouter();

  const menuItems = [
    { label: t('dashboard'), icon: LayoutDashboard, path: '/(main)/(tabs)/dashboard', color: primaryColor },
    { label: t('logExplorer'), icon: Search, path: '/(main)/(tabs)/log-explorer', color: '#3b82f6' },
    { label: t('errorGroups'), icon: Layers, path: '/(main)/(tabs)/error-groups', color: '#f59e0b' },
    { label: t('projects'), icon: FolderKanban, path: '/(main)/(tabs)/projects', color: '#10b981' },
    { label: t('channels'), icon: Hash, path: '/(main)/(tabs)/channels', color: '#6366f1' },
    { type: 'separator' },
    { label: t('sdkDocs'), icon: BookOpen, path: '/docs', color: '#8b5cf6' },
    { label: t('settings'), icon: Settings, path: '/(main)/(tabs)/settings', color: '#64748b' },
    { label: t('faq'), icon: HelpCircle, path: '/faq', color: '#14b8a6' },
  ];

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Profile Section */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.profileRow]}>
          <View style={[styles.avatar, { backgroundColor: primaryColor + '20' }]}>
            <Text style={[styles.avatarText, { color: primaryColor }]}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {user?.name || 'User'}
              </Text>
              {isAdmin && (
                <View style={[styles.adminBadge, { borderColor: '#a78bfa', backgroundColor: '#a78bfa15' }]}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
              {user?.email || 'user@example.com'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            if (item.type === 'separator') {
              return <View key={`sep-${index}`} style={[styles.separator, { backgroundColor: colors.border }]} />;
            }

            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { borderRadius: radius.md }]}
                onPress={() => handleNavigation(item.path)}
              >
                <View style={[styles.iconWrapper, { backgroundColor: item.color + '15' }]}>
                  <Icon size={18} color={item.color} strokeWidth={2} />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                <ChevronRight size={14} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer / Sign Out */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.error + '10' }]}
          onPress={() => {
            console.log('CustomDrawerContent: Logout button pressed');
            if (props.onLogout) {
              props.onLogout();
            } else {
              console.warn('CustomDrawerContent: onLogout prop is missing');
            }
          }}
        >
          <LogOut size={18} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>{t('signOut')}</Text>
        </TouchableOpacity>
        
        <Text style={[styles.versionText, { color: colors.textMuted }]}>
          {t('version')} v2.0.0
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    maxWidth: '70%',
  },
  adminBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8b5cf6',
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  menuScroll: {
    flex: 1,
  },
  menuContainer: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 4,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    marginVertical: 12,
    marginHorizontal: 12,
    opacity: 0.5,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    opacity: 0.5,
  }
});
