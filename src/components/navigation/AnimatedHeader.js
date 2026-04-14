import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Menu, ArrowLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography, radius } from '../../theme';

export const AnimatedHeader = ({ 
  scrollY, 
  title, 
  showAppBadge = true, 
  showBack = false,
  rightElement = null 
}) => {
  const { colors, primaryColor, isDark } = useTheme();
  const navigation = useNavigation();
  const router = useRouter();

  // Header background opacity
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Large title transform/opacity
  const largeTitleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const largeTitleTranslateY = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  // Small title opacity (navbar title)
  const smallTitleOpacity = scrollY.interpolate({
    inputRange: [30, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const smallTitleTranslateY = scrollY.interpolate({
    inputRange: [30, 60],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  const onLeftPress = () => {
    if (showBack) {
      router.back();
    } else {
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <View style={styles.root}>
      {/* Sticky Top Navbar Background */}
      <Animated.View 
        style={[
          styles.navbar, 
          { 
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.background,
            borderBottomColor: colors.border,
            opacity: headerBgOpacity,
            borderBottomWidth: 1,
            overflow: 'hidden',
          }
        ]} 
      >
        {Platform.OS === 'ios' && (
          <BlurView 
            intensity={80} 
            tint={isDark ? 'dark' : 'light'} 
            style={StyleSheet.absoluteFill} 
          />
        )}
      </Animated.View>
      
      <View style={styles.navbarContent}>
        <TouchableOpacity 
          onPress={onLeftPress}
          activeOpacity={0.7}
          style={[
            styles.drawerButton, 
            { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', 
              borderColor: colors.border 
            }
          ]}
        >
          {showBack ? (
            <ArrowLeft size={20} color={colors.text} />
          ) : (
            <Menu size={20} color={colors.text} />
          )}
        </TouchableOpacity>

        <Animated.View style={[
          styles.smallTitleContainer, 
          { opacity: smallTitleOpacity, transform: [{ translateY: smallTitleTranslateY }] }
        ]}>
          <Text style={[styles.smallTitle, { color: colors.text }]}>{title}</Text>
          {showAppBadge && (
            <View style={[styles.appBadge, { backgroundColor: primaryColor + '20', borderColor: primaryColor + '40' }]}>
              <Text style={[styles.appBadgeText, { color: primaryColor }]}>LogForge</Text>
            </View>
          )}
        </Animated.View>

        <View style={styles.rightElementContainer}>
          {rightElement}
        </View>
      </View>

      {/* Large Title (Collapsible) */}
      <Animated.View style={[
        styles.largeTitleContainer, 
        { 
          opacity: largeTitleOpacity, 
          transform: [{ translateY: largeTitleTranslateY }] 
        }
      ]}>
        <Text style={[styles.largeTitle, { color: colors.text }]}>{title}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  navbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 80,
  },
  navbarContent: {
    height: Platform.OS === 'ios' ? 100 : 80,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  drawerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  smallTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  smallTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  appBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginLeft: 8,
  },
  appBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rightElementContainer: {
    marginLeft: 'auto',
  },
  largeTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  largeTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
