import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import { LogLoader } from '../src/components/ui/LogLoader';

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/setup');
    } else if (user && inAuthGroup) {
      router.replace('/(main)/(stack)/(tabs)/dashboard');
    } else if (user && segments.length === 0) {
      router.replace('/(main)/(stack)/(tabs)/dashboard');
    }
  }, [user, loading, segments]);

  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <LogLoader text="Initializing" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
