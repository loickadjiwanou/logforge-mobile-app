import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../src/theme';

export default function SDKDocsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SDK Documentation</Text>
      <Text style={styles.text}>Integration guides for JS and Python.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, backgroundColor: colors.background.light },
  title: { ...typography.h2, marginBottom: spacing.md, color: colors.text.light },
  text: { ...typography.body, color: colors.textMuted.light }
});
