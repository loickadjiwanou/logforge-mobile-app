import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, radius, shadows } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export const Card = ({ children, style }) => {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>;
};

export const CardHeader = ({ children, style }) => (
  <View style={[styles.header, style]}>
    {typeof children === 'string' ? <Text>{children}</Text> : children}
  </View>
);

export const CardTitle = ({ children, style }) => {
  const { colors } = useTheme();
  return <Text style={[styles.title, { color: colors.text }, style]}>{children}</Text>;
};

export const CardDescription = ({ children, style }) => {
  const { colors } = useTheme();
  return <Text style={[styles.description, { color: colors.textMuted }, style]}>{children}</Text>;
};

export const CardContent = ({ children, style }) => (
  <View style={[styles.content, style]}>
    {typeof children === 'string' ? <Text>{children}</Text> : children}
  </View>
);

export const CardFooter = ({ children, style }) => {
  const { colors } = useTheme();
  return <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.sm,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    marginBottom: 4,
  },
  description: {
    ...typography.bodySmall,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  }
});
