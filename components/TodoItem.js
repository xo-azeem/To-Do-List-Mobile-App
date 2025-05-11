// components/TodoItem.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AntDesign } from '@expo/vector-icons';
import TodoService from '../services/TodoService';
import { useTheme } from '../contexts/ThemeContext';

const TodoSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Task is too short!')
    .max(50, 'Task is too long!')
    .required('Task cannot be empty')
});

const TodoItem = ({ id, title, completed, documentUrl, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { theme } = useTheme();

  const toggleComplete = async () => {
    try {
      await TodoService.updateTodo(id, { completed: !completed });
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating todo: ", error);
    }
  };

  const handleUpdateTodo = async (values) => {
    try {
      await TodoSchema.validate(values); // Explicit validation
      await TodoService.updateTodo(id, { title: values.title });
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating todo title: ", error);
      Alert.alert("Validation Error", error.message || "Invalid input");
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
          <Formik
            initialValues={{ title: title }}
            validationSchema={TodoSchema}
            validateOnMount={false}
            onSubmit={handleUpdateTodo}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
              <>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.inputBorder,
                      backgroundColor: theme.inputBackground,
                      color: theme.textPrimary
                    }
                  ]}
                  value={values.title}
                  onChangeText={handleChange('title')}
                  onBlur={handleBlur('title')}
                  autoFocus
                  placeholder="Edit task..."
                  placeholderTextColor={theme.textSecondary}
                />

                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[
                    styles.saveButton,
                    { backgroundColor: theme.success }
                  ]}
                >
                  <Text style={[styles.buttonText, { color: theme.cardBackground }]}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: theme.textSecondary }]}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={[styles.buttonText, { color: theme.cardBackground }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </Formik>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.itemContainer, { shadowColor: theme.shadow }]}>
      <TouchableOpacity onPress={navigateToDetails} activeOpacity={0.8}>
        <View style={[styles.item, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.mainContent}>
            <TouchableOpacity style={styles.todoInfo} onPress={toggleComplete}>
              <View style={[
                styles.checkbox,
                { borderColor: theme.accent },
                completed && { backgroundColor: theme.accent }
              ]}>
                {completed && <Text style={[styles.checkmark, { color: theme.cardBackground }]}>✓</Text>}
              </View>
              <View style={styles.titleContainer}>
                <Text style={[
                  styles.title,
                  { color: theme.textPrimary },
                  completed && { textDecorationLine: 'line-through', color: theme.textSecondary }
                ]}>
                  {title}
                </Text>
                
                {documentUrl && (
                  <View style={styles.documentIndicator}>
                    <AntDesign name="paperclip" size={14} color={theme.accent} />
                    <Text style={[styles.documentText, { color: theme.accent }]}>
                      Has attachment
                    </Text>
                  </View>
                )}
              </View>
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
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
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
    fontWeight: '500',
  },
  documentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  documentText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  editButton: {
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
    marginBottom: 10,
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
});

export default TodoItem;