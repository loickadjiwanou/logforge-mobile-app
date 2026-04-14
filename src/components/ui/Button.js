import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform, Animated } from 'react-native';
import { typography, spacing, radius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'default',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  paddingHorizontal
}) => {
  const { colors, primaryColor, isDark } = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) onPress();
  };

  const getBackgroundColor = () => {
    if (variant === 'primary' && Platform.OS === 'ios') return 'transparent';
    switch (variant) {
      case 'primary': return primaryColor;
      case 'secondary': return colors.card;
      case 'outline': return 'transparent';
      case 'destructive': return colors.error;
      case 'ghost': return 'transparent';
      default: return primaryColor;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return '#fff';
      case 'secondary': return colors.text;
      case 'outline': return colors.text;
      case 'destructive': return '#fff';
      case 'ghost': return colors.text;
      default: return '#fff';
    }
  };

  const getSizePadding = () => {
    switch (size) {
      case 'sm': return { minHeight: 36, paddingHorizontal: spacing.md };
      case 'lg': return { minHeight: 56, paddingHorizontal: spacing.xl };
      case 'icon': return { width: 44, height: 44, justifyContent: 'center' };
      default: return { minHeight: 48, paddingHorizontal: spacing.lg };
    }
  };

  const isLiquidGlass = variant === 'primary' && Platform.OS === 'ios';

  const renderContent = () => (
    <>
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </>
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.border },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        getSizePadding(),
        paddingHorizontal !== undefined && { paddingHorizontal },
        (disabled || isLoading) && styles.disabled,
        style
      ]}
    >
      {isLiquidGlass ? (
        <View style={StyleSheet.absoluteFill}>
          <BlurView 
            intensity={isDark ? 50 : 80} 
            tint={isDark ? 'dark' : 'light'} 
            style={[StyleSheet.absoluteFill, { borderRadius: radius.md, backgroundColor: primaryColor + '40' }]}
          />
          <LinearGradient
            colors={[primaryColor, primaryColor + '80', primaryColor + '40']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { opacity: 0.6, borderRadius: radius.md }]}
          />
          {/* Futuristic Border Highlight */}
          <View style={[StyleSheet.absoluteFill, { borderRadius: radius.md, borderWidth: 1, borderColor: primaryColor + '60' }]} />
          <View style={[styles.contentWrapper]}>
            {renderContent()}
          </View>
        </View>
      ) : (
        renderContent()
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.4,
  }
});
