import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Switch, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TodoService from '../../services/TodoService';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const { theme, isDark, toggleTheme } = useTheme();

  useEffect(() => {
    // Check network status
    const checkNetwork = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOnline(netInfo.isConnected && netInfo.isInternetReachable);
    };
    
    // Load last sync time
    const loadLastSync = async () => {
      try {
        const syncTime = await AsyncStorage.getItem('@lastSync');
        if (syncTime) {
          setLastSyncTime(new Date(syncTime));
        }
      } catch (error) {
        console.error('Error loading last sync time:', error);
      }
    };
    
    // Load auto sync preference
    const loadAutoSync = async () => {
      try {
        const value = await AsyncStorage.getItem('@autoSync');
        if (value !== null) {
          setAutoSync(JSON.parse(value));
        }
      } catch (error) {
        console.error('Error loading auto sync setting:', error);
      }
    };
    
    checkNetwork();
    loadLastSync();
    loadAutoSync();
    
    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  const toggleAutoSync = async (value) => {
    setAutoSync(value);
    try {
      await AsyncStorage.setItem('@autoSync', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving auto sync setting:', error);
    }
  };
  
  const syncNow = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You are currently offline. Please connect to the internet to sync.');
      return;
    }
    
    try {
      Alert.alert('Syncing', 'Syncing your tasks...');
      await TodoService.syncOfflineChanges();
      const now = new Date();
      setLastSyncTime(now);
      await AsyncStorage.setItem('@lastSync', now.toISOString());
      Alert.alert('Success', 'Your tasks have been synced successfully!');
    } catch (error) {
      console.error('Error syncing tasks:', error);
      Alert.alert('Sync Failed', 'There was an error syncing your tasks. Please try again.');
    }
  };
  
  const clearLocalData = () => {
    Alert.alert(
      'Clear Local Data',
      'This will remove all locally stored tasks. Your tasks will be reloaded from the server when you go back online. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@todos');
              Alert.alert('Success', 'Local data has been cleared.');
            } catch (error) {
              console.error('Error clearing local data:', error);
              Alert.alert('Error', 'Failed to clear local data.');
            }
          },
        },
      ]
    );
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.header, { color: theme.textPrimary }]}>Settings</Text>
        
        {/* THEME SETTINGS CARD */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Appearance</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialCommunityIcons 
                name={isDark ? "weather-night" : "white-balance-sunny"} 
                size={24} 
                color={theme.accent} 
                style={styles.settingIcon} 
              />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
            </View>
            <Switch
              trackColor={{ false: '#CBD0D3', true: '#A4C2F4' }}
              thumbColor={isDark ? theme.accent : '#f4f3f4'}
              onValueChange={toggleTheme}
              value={isDark}
            />
          </View>
        </View>
        
        {/* SYNC OPTIONS CARD */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Sync Options</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialCommunityIcons name="sync" size={24} color={theme.accent} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Auto Sync</Text>
            </View>
            <Switch
              trackColor={{ false: '#CBD0D3', true: '#A4C2F4' }}
              thumbColor={autoSync ? theme.accent : '#f4f3f4'}
              onValueChange={toggleAutoSync}
              value={autoSync}
            />
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <TouchableOpacity style={styles.settingItem} onPress={syncNow}>
            <View style={styles.settingLabelContainer}>
              <MaterialCommunityIcons name="cloud-sync" size={24} color={theme.accent} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Sync Now</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={theme.accent} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Last Sync</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
              {lastSyncTime ? lastSyncTime.toLocaleString() : 'Never'}
            </Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <MaterialCommunityIcons 
                name={isOnline ? "wifi" : "wifi-off"} 
                size={24} 
                color={isOnline ? theme.success : theme.error} 
                style={styles.settingIcon} 
              />
              <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Network Status</Text>
            </View>
            <Text style={[
              styles.settingValue, 
              {color: isOnline ? theme.success : theme.error}
            ]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={clearLocalData}>
            <View style={styles.settingLabelContainer}>
              <MaterialCommunityIcons name="delete-outline" size={24} color={theme.error} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, {color: theme.error}]}>Clear Local Data</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>Todo App v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 12,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
  },
});