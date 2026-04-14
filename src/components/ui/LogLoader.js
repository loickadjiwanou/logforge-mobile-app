import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../theme';

export const LogLoader = ({ text }) => {
  const { colors, isDark } = useTheme();
  
  // Create 9 animated values for the 9 bars
  const animatedValues = useRef([...Array(9)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = animatedValues.map((anim, i) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(anim, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach(anim => anim.start());

    return () => animations.forEach(anim => anim.stop());
  }, [animatedValues]);

  return (
    <View style={styles.container}>
      <View style={styles.waveContainer}>
        {animatedValues.map((anim, i) => {
          const scaleY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 1],
          });

          const opacity = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  backgroundColor: isDark ? '#fff' : '#18181b', // zinc-200 / zinc-900
                  opacity,
                  transform: [{ scaleY }],
                },
              ]}
            />
          );
        })}
      </View>
      
      {text && (
        <Text style={[styles.text, { color: colors.textMuted }]}>
          {text.toUpperCase()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 6,
  },
  bar: {
    width: 6,
    height: '100%',
    borderRadius: 3,
  },
  text: {
    marginTop: spacing.lg,
    ...typography.bodySmall,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
    fontWeight: '600',
  },
});
