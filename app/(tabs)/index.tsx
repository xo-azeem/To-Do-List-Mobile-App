// app/(tabs)/index.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator,
  Animated,
  StatusBar,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import TodoItem from '../../components/TodoItem';
import AddTodo from '../../components/AddTodo';
import TodoService from '../../services/TodoService';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

export default function TodoScreen() {
  const { theme } = useTheme();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadTodos = async () => {
    try {
      const online = await TodoService.isOnline();
      setIsOnline(online);
      
      if (online) {
        // Try to sync any offline changes
        await TodoService.syncOfflineChanges();
      }
      
      const todoList = await TodoService.getTodos();
      setTodos(todoList);
      setLoading(false);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error loading todos:", error);
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTodos();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadTodos();
  }, []);

  // Reload todos when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadTodos();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.accent }]}>Loading your tasks...</Text>
      </View>
    );
  }

  const completedTasks = todos.filter(todo => todo.completed).length;
  const totalTasks = todos.length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <Animated.View 
        style={[
          styles.container,
          { opacity: fadeAnim, backgroundColor: theme.background }
        ]}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.header, { color: theme.textPrimary }]}>My Tasks</Text>
          {totalTasks > 0 && (
            <Text style={[styles.statsText, { color: theme.textSecondary }]}>
              {completedTasks} of {totalTasks} completed
            </Text>
          )}
        </View>
        
        {!isOnline && (
          <View style={[styles.offlineBar, { 
            backgroundColor: theme.offlineBackground, 
            borderColor: theme.offlineBorder 
          }]}>
            <Text style={[styles.offlineText, { color: theme.offlineText }]}>
              You're offline. Changes will sync when you're back online.
            </Text>
          </View>
        )}
        
        <AddTodo onTodoAdded={loadTodos} />
        
        {todos.length > 0 ? (
          <FlatList
            data={todos}
            renderItem={({ item }) => (
              <TodoItem
                id={item.id}
                title={item.title}
                completed={item.completed}
                onUpdate={loadTodos}
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.accent]}
                tintColor={theme.accent}
                progressBackgroundColor={theme.cardBackground}
              />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: theme.accent }]}>All Clear!</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Add your first task above.</Text>
          </View>
        )}
      </Animated.View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12, 
    fontSize: 16,
  },
  headerSection: {
    marginBottom: 24,
    marginTop: 12,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  offlineBar: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  offlineText: {
    textAlign: 'center',
    fontSize: 14,
  },
});