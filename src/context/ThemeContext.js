import React, { createContext, useContext, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors as baseColors } from '../theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('dark');
  const [primaryColor, setPrimaryColor] = useState(baseColors.primary);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('logforge_theme');
      const storedColor = await AsyncStorage.getItem('logforge_color');
      const storedLogo = await AsyncStorage.getItem('logforge_logo');
      if (storedTheme) setThemeMode(storedTheme);
      if (storedColor) setPrimaryColor(storedColor);
      if (storedLogo) setLogoUrl(storedLogo);
    } catch (e) {}
  };

  const updateTheme = (mode, color, logo) => {
    if (mode) {
      setThemeMode(mode);
      AsyncStorage.setItem('logforge_theme', mode).catch(e => console.error(e));
    }
    if (color) {
      setPrimaryColor(color);
      AsyncStorage.setItem('logforge_color', color).catch(e => console.error(e));
    }
    if (logo !== undefined) {
      setLogoUrl(logo);
      if (logo) {
        AsyncStorage.setItem('logforge_logo', logo).catch(e => console.error(e));
      } else {
        AsyncStorage.removeItem('logforge_logo').catch(e => console.error(e));
      }
    }
  };

  const isDark = themeMode === 'dark';

  const themeColors = {
    primary: primaryColor,
    background: isDark ? baseColors.background.dark : baseColors.background.light,
    card: isDark ? baseColors.card.dark : baseColors.card.light,
    text: isDark ? baseColors.text.dark : baseColors.text.light,
    textMuted: isDark ? baseColors.textMuted.dark : baseColors.textMuted.light,
    border: isDark ? baseColors.border.dark : baseColors.border.light,
    error: baseColors.error,
    success: baseColors.success,
    warning: baseColors.warning,
    info: baseColors.info,
  };

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, primaryColor, logoUrl, colors: themeColors, updateTheme }}>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={themeColors.background} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
