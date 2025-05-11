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
  StatusBar,
  Linking,
  Alert
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import TodoService from '../../services/TodoService';
import CloudinaryService from '../../services/CloudinaryService';
import { useTheme } from '../../contexts/ThemeContext';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export default function TodoDetailsScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [document, setDocument] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [uploadingDocument, setUploadingDocument] = useState(false);

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

  const openDocument = async () => {
    if (todo.documentUrl) {
      try {
        const canOpen = await Linking.canOpenURL(todo.documentUrl);
        if (canOpen) {
          await Linking.openURL(todo.documentUrl);
        } else {
          Alert.alert(
            "Cannot Open Document",
            "Your device doesn't have an app that can open this type of document."
          );
        }
      } catch (error) {
        console.error("Error opening document:", error);
        Alert.alert("Error", "Failed to open document");
      }
    }
  };

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

  const attachDocument = async () => {
    if (!document) {
      Alert.alert("Error", "Please select a document first");
      return;
    }

    try {
      setUploadingDocument(true);
      
      // Upload the document to Cloudinary and update the todo
      const updatedTodos = await TodoService.updateTodo(id, {}, document);
      
      // Refresh todo data
      const updatedTodo = await TodoService.getTodoById(id);
      setTodo(updatedTodo);
      
      // Clear the document selection
      setDocument(null);
      setDocumentName('');
      
      Alert.alert("Success", "Document attached successfully");
    } catch (error) {
      console.error("Error attaching document:", error);
      Alert.alert("Error", "Failed to attach document. Please try again.");
    } finally {
      setUploadingDocument(false);
    }
  };

  const deleteDocument = async () => {
    if (!todo.documentUrl || !todo.documentId) {
      return;
    }

    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete the attached document?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Update todo to remove document reference
              await TodoService.updateTodo(id, {
                documentUrl: null,
                documentId: null
              });
              
              // Try to delete from Cloudinary (might not work directly, as noted in CloudinaryService)
              if (todo.documentId) {
                try {
                  await CloudinaryService.deleteDocument(todo.documentId);
                } catch (cloudinaryError) {
                  console.warn("Couldn't delete document from Cloudinary:", cloudinaryError);
                  // Continue anyway since we've removed the reference from the todo
                }
              }
              
              // Update local state
              setTodo({
                ...todo,
                documentUrl: null,
                documentId: null
              });
              
              Alert.alert("Success", "Document removed successfully");
            } catch (error) {
              console.error("Error removing document:", error);
              Alert.alert("Error", "Failed to remove document");
            }
          }
        }
      ]
    );
  };

  const getDocumentFileName = () => {
    if (!todo.documentUrl) return "";
    
    // Extract filename from URL
    const urlParts = todo.documentUrl.split('/');
    let fileName = urlParts[urlParts.length - 1];
    
    // Remove any query parameters
    fileName = fileName.split('?')[0];
    
    // Decode URI components
    try {
      fileName = decodeURIComponent(fileName);
    } catch (e) {
      // If decoding fails, use the encoded version
    }
    
    return fileName;
  };

  const getDocumentType = () => {
    if (!todo.documentUrl) return "file";
    
    const url = todo.documentUrl.toLowerCase();
    
    if (url.includes('.pdf')) return "pdf";
    else if (url.includes('.doc') || url.includes('.docx')) return "word";
    else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif')) return "image";
    else if (url.includes('.txt')) return "text";
    else return "file";
  };

  const renderDocumentIcon = () => {
    const docType = getDocumentType();
    
    switch (docType) {
      case "pdf":
        return <AntDesign name="pdffile1" size={24} color={theme.accent} />;
      case "word":
        return <MaterialCommunityIcons name="file-word" size={24} color={theme.accent} />;
      case "image":
        return <AntDesign name="picture" size={24} color={theme.accent} />;
      case "text":
        return <AntDesign name="filetext1" size={24} color={theme.accent} />;
      default:
        return <AntDesign name="file1" size={24} color={theme.accent} />;
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
                <Formik
                  initialValues={{ title, description }}
                  enableReinitialize
                  validationSchema={Yup.object({
                    title: Yup.string()
                      .required('Title is required')
                      .min(3, 'Title is too short'),
                    description: Yup.string()
                      .max(50, 'Title is too long'),
                  })}
                  onSubmit={async (values, { setSubmitting }) => {
                    try {
                      await TodoService.updateTodo(id, {
                        title: values.title,
                        description: values.description,
                      });
                    
                      setTitle(values.title);
                      setDescription(values.description);
                      setIsEditing(false);
                      setTodo({
                        ...todo,
                        title: values.title,
                        description: values.description,
                      });
                    } catch (error) {
                      console.error('Error updating todo:', error);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
                    <View style={styles.editForm}>
                      <Text style={[styles.label, { color: theme.textPrimary }]}>Task Title</Text>
                      <TextInput
                        style={[
                          styles.titleInput,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.divider,
                            color: theme.textPrimary,
                          },
                        ]}
                        value={values.title}
                        onChangeText={handleChange('title')}
                        onBlur={handleBlur('title')}
                        placeholder="Task title"
                        placeholderTextColor={theme.textSecondary}
                      />
                      {touched.title && errors.title && (
                        <Text style={{ color: theme.error, marginBottom: 8 }}>{errors.title}</Text>
                      )}

                      <Text style={[styles.label, { color: theme.textPrimary }]}>Description</Text>
                      <TextInput
                        style={[
                          styles.descriptionInput,
                          {
                            backgroundColor: theme.background,
                            borderColor: theme.divider,
                            color: theme.textPrimary,
                          },
                        ]}
                        value={values.description}
                        onChangeText={handleChange('description')}
                        onBlur={handleBlur('description')}
                        placeholder="Add a description"
                        placeholderTextColor={theme.textSecondary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                      {touched.description && errors.description && (
                        <Text style={{ color: theme.error, marginBottom: 8 }}>{errors.description}</Text>
                      )}

                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={[styles.saveButton, { backgroundColor: theme.success }]}
                          onPress={handleSubmit}
                          disabled={isSubmitting}
                        >
                          <Text style={styles.buttonText}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                          </Text>
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
                  )}
                </Formik>
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
                
                {/* Document Section */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Document</Text>
                
                {todo.documentUrl ? (
                  <View style={styles.documentContainer}>
                    <View style={[styles.documentBox, { 
                      borderColor: theme.divider,
                      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                    }]}>
                      <View style={styles.documentInfo}>
                        {renderDocumentIcon()}
                        <Text style={[styles.documentName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {getDocumentFileName()}
                        </Text>
                      </View>
                      
                      <View style={styles.documentActions}>
                        <TouchableOpacity 
                          style={[styles.documentButton, { backgroundColor: theme.accent }]} 
                          onPress={openDocument}
                        >
                          <Text style={styles.documentButtonText}>View</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.documentButton, { backgroundColor: theme.error }]} 
                          onPress={deleteDocument}
                        >
                          <Text style={styles.documentButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={[styles.noDocumentText, { color: theme.textSecondary }]}>
                      No document attached.
                    </Text>
                    
                    {!document ? (
                      <TouchableOpacity 
                        style={[
                          styles.attachButton,
                          {
                            backgroundColor: theme.buttonBackground, // Use the new theme property
                            borderColor: theme.divider,
                          },
                        ]}
                        onPress={pickDocument}
                      >
                        <AntDesign name="paperclip" size={20} color={theme.accent} />
                        <Text style={[styles.attachButtonText, { color: theme.textPrimary }]}>
                          Attach Document
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View>
                        <View style={[styles.selectedDocumentContainer, { 
                          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                          borderColor: theme.divider
                        }]}>
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
                        
                        <View style={styles.documentActionRow}>
                          <TouchableOpacity 
                            style={[styles.uploadButton, { backgroundColor: theme.accent }]} 
                            onPress={attachDocument}
                            disabled={uploadingDocument}
                          >
                            <Text style={styles.buttonText}>
                              {uploadingDocument ? 'Uploading...' : 'Upload Document'}
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.cancelUploadButton, { backgroundColor: theme.textSecondary }]}
                            onPress={clearDocument}
                            disabled={uploadingDocument}
                          >
                            <Text style={styles.buttonText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
                
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
  },
  // Document section styles
  documentContainer: {
    marginBottom: 16,
  },
  documentBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentName: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  documentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  documentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  documentButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  noDocumentText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    justifyContent: 'center',
  },
  attachButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  selectedDocumentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectedDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelUploadButton: {
    flex: 0.5,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  }
});