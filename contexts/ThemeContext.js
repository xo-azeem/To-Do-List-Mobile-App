// contexts/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define light theme colors
export const lightTheme = {
  background: '#F5F7FA',
  cardBackground: '#FFFFFF',
  textPrimary: '#2C3E50',
  textSecondary: '#7F8C8D',
  accent: '#4A6FA5',
  statusBar: 'dark-content',
  divider: '#E0E0E0',
  inputBackground: '#F5F7FA',
  inputBorder: '#E0E0E0',
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  offlineBackground: '#FFF3CD',
  offlineBorder: '#FFE69C',
  offlineText: '#856404',
  shadow: '#000',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E0E0E0',
};

// Define dark theme colors
export const darkTheme = {
  background: '#121212',
  cardBackground: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  accent: '#5F8DD3',
  statusBar: 'light-content',
  divider: '#333333',
  inputBackground: '#2C2C2C',
  inputBorder: '#3D3D3D',
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  offlineBackground: '#3E3D2C',
  offlineBorder: '#524E31',
  offlineText: '#E6D384',
  shadow: '#000',
  tabBarBackground: '#1E1E1E',
  tabBarBorder: '#333333',
};

// Create the theme context
const ThemeContext = createContext({
  theme: lightTheme,
  isDark: false,
  toggleTheme: () => {},
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Load theme preference from AsyncStorage
  const loadThemePreference = async () => {
    try {
      const themePreference = await AsyncStorage.getItem('@theme_mode');
      
      if (themePreference !== null) {
        setIsDark(themePreference === 'dark');
      } else {
        // If no preference is saved, use device default
        setIsDark(deviceTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      setIsDark(deviceTheme === 'dark');
    }
  };

  // Save theme preference to AsyncStorage
  const saveThemePreference = async (isDarkMode) => {
    try {
      await AsyncStorage.setItem('@theme_mode', isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Toggle theme function
  const toggleTheme = () => {
    setIsDark((prevIsDark) => {
      const newIsDark = !prevIsDark;
      saveThemePreference(newIsDark);
      return newIsDark;
    });
  };

  // Context value
  const value = {
    theme: isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;