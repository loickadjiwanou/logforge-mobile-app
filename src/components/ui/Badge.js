import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { radius } from '../../theme';

export const Badge = ({ text, variant = 'primary', size = 'medium', style }) => {
  const { colors, primaryColor } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: colors.border + '30', color: colors.textMuted };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1, color: colors.textMuted };
      case 'danger':
        return { backgroundColor: '#ef444420', color: '#ef4444' };
      case 'success':
        return { backgroundColor: '#10b98120', color: '#10b981' };
      default:
        return { backgroundColor: primaryColor + '20', color: primaryColor };
    }
  };

  const vStyle = getVariantStyle();
  
  return (
    <View style={[
      styles.badge, 
      { backgroundColor: vStyle.backgroundColor },
      vStyle.borderColor && { borderColor: vStyle.borderColor, borderWidth: vStyle.borderWidth },
      size === 'small' && styles.compact,
      style
    ]}>
      <Text style={[
        styles.text, 
        { color: vStyle.color },
        size === 'small' && { fontSize: 9 }
      ]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compact: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
