// components/AddTodo.js
import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text } from 'react-native';
import TodoService from '../services/TodoService';
import { useTheme } from '../contexts/ThemeContext';

const AddTodo = ({ onTodoAdded }) => {
  const [title, setTitle] = useState('');
  const { theme } = useTheme();

  const addTodo = async () => {
    if (title.trim() === '') return;
    
    try {
      await TodoService.addTodo(title);
      setTitle(''); // Clear input after adding
      if (onTodoAdded) onTodoAdded();
    } catch (error) {
      console.error("Error adding todo: ", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }]}>
        <TextInput
          style={[styles.input, { 
            color: theme.textPrimary, 
            borderBottomColor: theme.divider,
            backgroundColor: theme.inputBackground
          }]}
          placeholder="What needs to be done?"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
        />
        <TouchableOpacity 
          style={[
            styles.addButton, 
            { backgroundColor: theme.accent },
            title.trim() === '' && { backgroundColor: theme.isDark ? '#3D5A7D' : '#A0BDE6' }
          ]} 
          onPress={addTodo}
          disabled={title.trim() === ''}
        >
          <Text style={[styles.addButtonText, { color: theme.cardBackground }]}>Add Task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inputContainer: {
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    padding: 8,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
    borderRadius: 8,
  },
  addButton: {
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddTodo;