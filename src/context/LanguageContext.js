import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../locales';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    loadLang();
  }, []);

  const loadLang = async () => {
    try {
      const stored = await AsyncStorage.getItem('logforge_lang');
      if (stored && ['en', 'fr'].includes(stored)) {
        setLang(stored);
      }
    } catch (e) {}
  };

  const changeLanguage = (newLang) => {
    setLang(newLang);
    AsyncStorage.setItem('logforge_lang', newLang).catch(e => console.error(e));
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
