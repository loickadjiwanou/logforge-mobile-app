import { Tabs } from 'expo-router';
import { Home, Folder, Activity, Settings, AlertCircle, Menu, Search, Hash } from 'lucide-react-native';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { TouchableOpacity, Platform } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary || '#10b981',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { 
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          ...(Platform.OS === 'ios' && { borderTopWidth: 0.5 })
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('dashboard') || 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="log-explorer"
        options={{
          title: t('logExplorer') || 'Logs',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t('projects') || 'Projects',
          tabBarIcon: ({ color, size }) => <Folder color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings') || 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
      
      {/* Hidden tabs */}
      <Tabs.Screen
        name="error-groups"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
