import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { typography, spacing, radius } from '../theme';
import { useTheme } from './ThemeContext';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-50)).current;
  const insets = useSafeAreaInsets();
  const { primaryColor } = useTheme();

  const showToast = useCallback((message, type = 'success') => {
    setToast({ visible: true, message, type });
    
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    // Auto hide after 1s (user request) + animation time
    setTimeout(() => {
      hideToast();
    }, 1250);
  }, []);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setToast(prev => ({ ...prev, visible: false }));
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View 
          style={[
            styles.toastContainer, 
            { 
              opacity, 
              transform: [{ translateY }],
              top: insets.top + 10,
              backgroundColor: toast.type === 'success' ? primaryColor : '#ef4444' 
            }
          ]}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#fff" />
          ) : (
            <AlertCircle size={18} color="#fff" />
          )}
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
