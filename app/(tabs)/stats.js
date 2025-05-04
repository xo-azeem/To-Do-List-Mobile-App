import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import TodoService from '../../services/TodoService';
import { useTheme } from '../../contexts/ThemeContext';

export default function StatsScreen() {
  const { theme } = useTheme();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTodos = async () => {
      try {
        const todoList = await TodoService.getTodos();
        setTodos(todoList);
        setLoading(false);
      } catch (error) {
        console.error("Error loading todos for stats:", error);
        setLoading(false);
      }
    };

    loadTodos();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.accent }]}>Loading stats...</Text>
      </View>
    );
  }

  // Calculate statistics
  const totalTasks = todos.length;
  const completedTasks = todos.filter(todo => todo.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.header, { color: theme.textPrimary }]}>Task Statistics</Text>
        
        <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Overview</Text>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Tasks</Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{totalTasks}</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</Text>
            <Text style={[styles.statValue, { color: theme.success }]}>{completedTasks}</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending</Text>
            <Text style={[styles.statValue, { color: theme.warning }]}>{pendingTasks}</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Completion Rate</Text>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{completionRate}%</Text>
          </View>
        </View>
        
        <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Progress</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: theme.divider }]}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${completionRate}%`, backgroundColor: theme.accent }
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {completionRate}% completed
            </Text>
          </View>
        </View>
      </View>
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
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBarBackground: {
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
  }
});