// app/todo/[id].js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import TodoService from '../../services/TodoService';
import { useTheme } from '../../contexts/ThemeContext';

export default function TodoDetailsScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const loadTodo = async () => {
      try {
        const todoData = await TodoService.getTodoById(id);
        if (todoData) {
          setTodo(todoData);
          setTitle(todoData.title || '');
          setDescription(todoData.description || '');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading todo details:', error);
        setLoading(false);
      }
    };

    loadTodo();
  }, [id]);

  const handleSave = async () => {
    try {
      await TodoService.updateTodo(id, {
        title,
        description
      });
      setIsEditing(false);
      
      // Update local state
      setTodo({
        ...todo,
        title,
        description
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const toggleComplete = async () => {
    try {
      const updatedCompleted = !todo.completed;
      await TodoService.updateTodo(id, {
        completed: updatedCompleted
      });
      
      // Update local state
      setTodo({
        ...todo,
        completed: updatedCompleted
      });
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await TodoService.deleteTodo(id);
      router.back();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.accent }]}>Loading task details...</Text>
      </View>
    );
  }

  if (!todo) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
        <Stack.Screen 
          options={{ 
            title: 'Task Not Found',
            headerTintColor: theme.accent,
            headerStyle: { backgroundColor: theme.background },
          }} 
        />
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.notFoundText, { color: theme.textSecondary }]}>Task not found</Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.accent }]} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <Stack.Screen 
        options={{ 
          title: isEditing ? 'Edit Task' : 'Task Details',
          headerTitleStyle: {
            color: theme.accent,
            fontWeight: 'bold',
          },
          headerStyle: { 
            backgroundColor: theme.background 
          },
          headerTintColor: theme.accent
        }} 
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={[styles.card, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}>
            {isEditing ? (
              <View style={styles.editForm}>
                <Text style={[styles.label, { color: theme.textPrimary }]}>Task Title</Text>
                <TextInput
                  style={[styles.titleInput, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.divider,
                    color: theme.textPrimary
                  }]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Task title"
                  placeholderTextColor={theme.textSecondary}
                />
                
                <Text style={[styles.label, { color: theme.textPrimary }]}>Description</Text>
                <TextInput
                  style={[styles.descriptionInput, { 
                    backgroundColor: theme.background, 
                    borderColor: theme.divider,
                    color: theme.textPrimary
                  }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add a description"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.saveButton, { backgroundColor: theme.success }]} 
                    onPress={handleSave}
                  >
                    <Text style={styles.buttonText}>Save Changes</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => {
                      setTitle(todo.title || '');
                      setDescription(todo.description || '');
                      setIsEditing(false);
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusIndicator, 
                    todo.completed ? 
                    { backgroundColor: theme.success } : 
                    { backgroundColor: theme.warning }
                  ]} />
                  <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                    {todo.completed ? 'Completed' : 'Pending'}
                  </Text>
                </View>
                
                <Text style={[styles.title, { color: theme.textPrimary }]}>{todo.title}</Text>
                
                <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Description</Text>
                <Text style={[styles.description, { color: theme.textPrimary }]}>
                  {todo.description ? todo.description : 'No description added.'}
                </Text>
                
                <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Created</Text>
                <Text style={[styles.timeText, { color: theme.textSecondary }]}>
                  {todo.createdAt instanceof Date 
                    ? todo.createdAt.toLocaleString() 
                    : new Date(todo.createdAt).toLocaleString()}
                </Text>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={[styles.completeToggleButton, { backgroundColor: todo.completed ? theme.warning : theme.success }]} 
                    onPress={toggleComplete}
                  >
                    <Text style={styles.buttonText}>
                      {todo.completed ? 'Mark as Pending' : 'Mark as Complete'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.editButton, { backgroundColor: theme.accent }]} 
                    onPress={() => setIsEditing(true)}
                  >
                    <Text style={styles.buttonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.deleteButton, { backgroundColor: theme.error }]} 
                    onPress={handleDelete}
                  >
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
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
  card: {
    borderRadius: 12,
    padding: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  timeText: {
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  completeToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  editButton: {
    flex: 0.4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 0.4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95A5A6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notFoundText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editForm: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  }
});