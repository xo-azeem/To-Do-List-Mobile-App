import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  Alert,
  Platform,
  Image
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as DocumentPicker from 'expo-document-picker';
import { AntDesign } from '@expo/vector-icons';
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
  const [document, setDocument] = useState(null);
  const [documentName, setDocumentName] = useState('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'text/plain'],
        copyToCacheDirectory: true
      });
      
      // DocumentPicker behavior changed in newer Expo versions
      if (result.canceled === false && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setDocument(file.uri);
        setDocumentName(file.name);
      } else if (result.type === 'success') {
        // For backward compatibility
        setDocument(result.uri);
        setDocumentName(result.name);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to select document.");
    }
  };

  const clearDocument = () => {
    setDocument(null);
    setDocumentName('');
  };

  const handleAddTodo = async (values, { resetForm }) => {
    try {
      await TodoService.addTodo(values.title, document);
      resetForm();
      setDocument(null);
      setDocumentName('');
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

            {/* Document attachment section */}
            <View style={styles.documentSection}>
              <TouchableOpacity
                style={[
                  styles.documentButton,
                  { 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.divider
                  }
                ]}
                onPress={pickDocument}
              >
                <AntDesign name="paperclip" size={20} color={theme.accent} />
                <Text style={[styles.documentButtonText, { color: theme.textPrimary }]}>
                  {document ? 'Change Document' : 'Attach Document'}
                </Text>
              </TouchableOpacity>
              {document && (
                <View style={styles.selectedDocumentContainer}>
                  <View style={styles.selectedDocument}>
                    <AntDesign name="file1" size={18} color={theme.accent} />
                    <Text style={[styles.documentName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {documentName}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={clearDocument}>
                    <AntDesign name="close" size={18} color={theme.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
  documentSection: {
    marginVertical: 8,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  documentButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDocumentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  selectedDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentName: {
    marginLeft: 6,
    fontSize: 14,
    flex: 1,
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