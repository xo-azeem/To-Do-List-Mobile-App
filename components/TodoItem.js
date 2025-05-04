// components/TodoItem.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Animated } from 'react-native';
import { router } from 'expo-router';
import TodoService from '../services/TodoService';
import { useTheme } from '../contexts/ThemeContext';

const TodoItem = ({ id, title, completed, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const { theme } = useTheme();

  const toggleComplete = async () => {
    try {
      await TodoService.updateTodo(id, { completed: !completed });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating todo: ", error);
    }
  };

  const updateTodo = async () => {
    if (editedTitle.trim() === '') return;
    
    try {
      await TodoService.updateTodo(id, { title: editedTitle });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating todo title: ", error);
    }
  };

  const deleteTodo = async () => {
    try {
      await TodoService.deleteTodo(id);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting todo: ", error);
    }
  };

  const navigateToDetails = () => {
    router.push(`/todo/${id}`);
  };

  if (isEditing) {
    return (
      <View style={[styles.itemContainer, { shadowColor: theme.shadow }]}>
        <View style={[styles.item, { backgroundColor: theme.cardBackground }]}>
          <TextInput
            style={[styles.input, { 
              borderColor: theme.inputBorder, 
              backgroundColor: theme.inputBackground,
              color: theme.textPrimary
            }]}
            value={editedTitle}
            onChangeText={setEditedTitle}
            autoFocus
            placeholder="Edit task..."
            placeholderTextColor={theme.textSecondary}
          />
          <View style={styles.editButtonContainer}>
            <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.success }]} onPress={updateTodo}>
              <Text style={[styles.buttonText, { color: theme.cardBackground }]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.textSecondary }]} onPress={() => setIsEditing(false)}>
              <Text style={[styles.buttonText, { color: theme.cardBackground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.itemContainer, { shadowColor: theme.shadow }]}>
      <TouchableOpacity onPress={navigateToDetails} activeOpacity={0.8}>
        <View style={[styles.item, { backgroundColor: theme.cardBackground }]}>
          <TouchableOpacity style={styles.todoInfo} onPress={toggleComplete}>
            <View style={[
              styles.checkbox, 
              { borderColor: theme.accent },
              completed && { backgroundColor: theme.accent }
            ]}>
              {completed && <Text style={[styles.checkmark, { color: theme.cardBackground }]}>✓</Text>}
            </View>
            <Text style={[
              styles.title, 
              { color: theme.textPrimary },
              completed && { textDecorationLine: 'line-through', color: theme.textSecondary }
            ]}>
              {title}
            </Text>
          </TouchableOpacity>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.accent }]} onPress={() => setIsEditing(true)}>
              <Text style={[styles.buttonText, { color: theme.cardBackground }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.deleteButton, { backgroundColor: theme.error }]} onPress={deleteTodo}>
              <Text style={[styles.buttonText, { color: theme.cardBackground }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  item: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  editButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  editButton: {
    marginHorizontal: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveButton: {
    marginHorizontal: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  cancelButton: {
    marginHorizontal: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButton: {
    marginHorizontal: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 14,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
});

export default TodoItem;