import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import TodoService from '../services/TodoService';
import { useTheme } from '../contexts/ThemeContext';

const TodoSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Task is too short!')
    .max(50, 'Task is too long!')
    .required('Task cannot be empty')
});

const AddTodo = ({ onTodoAdded }) => {
  const { theme } = useTheme();

  const handleAddTodo = async (values, { resetForm }) => {
    try {
      await TodoService.addTodo(values.title);
      resetForm();
      if (onTodoAdded) onTodoAdded();
    } catch (error) {
      console.error("Error adding todo: ", error);
      Alert.alert("Error", "Failed to add task. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{ title: '' }}
        validationSchema={TodoSchema}
        onSubmit={(values, formikBag) => handleAddTodo(values, formikBag)}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isValid }) => (
          <View style={[
            styles.inputContainer, 
            { backgroundColor: theme.cardBackground, shadowColor: theme.shadow }
          ]}>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.textPrimary,
                  borderBottomColor: theme.divider,
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.divider
                }
              ]}
              placeholder="What needs to be done?"
              placeholderTextColor={theme.textSecondary}
              value={values.title}
              onChangeText={handleChange('title')}
              onBlur={handleBlur('title')}
            />

            <TouchableOpacity 
              style={[
                styles.addButton,
                { backgroundColor: theme.accent },
                (!isValid || values.title.trim() === '') && 
                  { backgroundColor: theme.isDark ? '#3D5A7D' : '#A0BDE6' }
              ]} 
              onPress={() => {
                if (!isValid) {
                  const errorMsg = errors.title || "Invalid input";
                  Alert.alert("Validation Error", errorMsg);
                } else {
                  handleSubmit();
                }
              }}
            >
              <Text style={[styles.addButtonText, { color: theme.cardBackground }]}>Add Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
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
    borderWidth: 1,
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