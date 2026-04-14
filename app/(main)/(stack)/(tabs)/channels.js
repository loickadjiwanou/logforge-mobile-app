import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '../../../../src/context/ThemeContext';
import { useLanguage } from '../../../../src/context/LanguageContext';
import { spacing, typography } from '../../../../src/theme';
import { AnimatedHeader } from '../../../../src/components/navigation/AnimatedHeader';

export default function ChannelsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const scrollY = useRef(new Animated.Value(0)).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedHeader scrollY={scrollY} title={t('channels')} />
      
      <Animated.ScrollView 
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSpacer} />
        <View style={styles.content}>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            Project channels will be listed here.
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerSpacer: { height: Platform.OS === 'ios' ? 140 : 120 },
  content: { padding: 20 },
  text: { ...typography.body },
});
