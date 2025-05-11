// services/TodoService.js
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, getDocs, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import NetInfo from '@react-native-community/netinfo';
import { getAuth } from 'firebase/auth';
import CloudinaryService from './CloudinaryService';

const TODOS_STORAGE_KEY = '@todos';
const LAST_SYNC_KEY = '@lastSync';

class TodoService {
  // Get current user ID
  getCurrentUserId() {
    const auth = getAuth();
    return auth.currentUser?.uid;
  }

  // Check if device is online
  async isOnline() {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected && netInfo.isInternetReachable;
  }

  // Save todos to AsyncStorage with user ID prefix
  async saveToLocalStorage(todos) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;
      
      const storageKey = `${TODOS_STORAGE_KEY}_${userId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(todos));
      await AsyncStorage.setItem(`${LAST_SYNC_KEY}_${userId}`, new Date().toISOString());
    } catch (error) {
      console.error('Error saving todos to AsyncStorage:', error);
    }
  }

  // Get todos from AsyncStorage for current user
  async getFromLocalStorage() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return [];
      
      const storageKey = `${TODOS_STORAGE_KEY}_${userId}`;
      const todosJson = await AsyncStorage.getItem(storageKey);
      return todosJson ? JSON.parse(todosJson) : [];
    } catch (error) {
      console.error('Error getting todos from AsyncStorage:', error);
      return [];
    }
  }

  // Get todos (from Firestore if online, otherwise from AsyncStorage)
  async getTodos() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return [];
      
      const isOnline = await this.isOnline();
      
      if (isOnline) {
        // Get from Firestore - filter by current user
        const q = query(
          collection(db, 'todos'), 
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const todoList = [];
        
        querySnapshot.forEach((doc) => {
          todoList.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          });
        });
        
        // Save to local storage for offline access
        await this.saveToLocalStorage(todoList);
        return todoList;
      } else {
        // Get from AsyncStorage if offline
        return await this.getFromLocalStorage();
      }
    } catch (error) {
      console.error('Error getting todos:', error);
      // Fall back to local storage if there's an error
      return await this.getFromLocalStorage();
    }
  }

  // Add a new todo with optional document
  async addTodo(title, documentUri = null) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const isOnline = await this.isOnline();
      const newTodo = {
        title,
        completed: false,
        createdAt: new Date(),
        description: '',
        userId: userId, // Associate todo with current user
        documentUrl: null,
        documentId: null
      };
      
      // Handle document upload if provided
      if (documentUri && isOnline) {
        // Create a temporary ID for the todo to use in the document upload
        const tempId = 'temp_' + new Date().getTime();
        
        // Upload document to Cloudinary
        const uploadResult = await CloudinaryService.uploadDocument(documentUri, tempId);
        
        // Add document information to the todo
        if (uploadResult) {
          newTodo.documentUrl = uploadResult.url;
          newTodo.documentId = uploadResult.publicId;
        }
      }
      
      if (isOnline) {
        // Add to Firestore
        const docRef = await addDoc(collection(db, 'todos'), newTodo);
        newTodo.id = docRef.id;
        
        // If we uploaded a document with a temporary ID, update the document ID in Cloudinary
        if (documentUri && newTodo.documentId && newTodo.documentId.includes('temp_')) {
          // Re-upload with correct ID or update the metadata - depends on Cloudinary implementation
          // For simplicity, we'll just keep the original upload in this example
          
          // In a real implementation, you might want to rename or update the publicId
          // through Cloudinary's API or re-upload with the correct ID
        }
        
        // Update local storage
        const todos = await this.getFromLocalStorage();
        todos.unshift(newTodo);
        await this.saveToLocalStorage(todos);
      } else {
        // Add to local storage only with a temporary ID
        newTodo.id = 'local_' + new Date().getTime();
        newTodo.pendingSync = true;
        
        // If document was provided but we're offline, save the uri for later upload
        if (documentUri) {
          newTodo.pendingDocumentUri = documentUri;
        }
        
        const todos = await this.getFromLocalStorage();
        todos.unshift(newTodo);
        await this.saveToLocalStorage(todos);
      }
      
      return newTodo;
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error;
    }
  }

  // Update a todo
  async updateTodo(id, updates, documentUri = null) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const isOnline = await this.isOnline();
      const updatedData = { ...updates };
      
      // Handle document upload if provided
      if (documentUri && isOnline) {
        // Upload document to Cloudinary
        const uploadResult = await CloudinaryService.uploadDocument(documentUri, id);
        
        // Add document information to the todo
        if (uploadResult) {
          updatedData.documentUrl = uploadResult.url;
          updatedData.documentId = uploadResult.publicId;
        }
      }
      
      if (isOnline && !id.startsWith('local_')) {
        // Update in Firestore
        const todoRef = doc(db, 'todos', id);
        await updateDoc(todoRef, updatedData);
      }
      
      // Update in local storage
      const todos = await this.getFromLocalStorage();
      const updatedTodos = todos.map(todo => {
        if (todo.id === id) {
          // If document was provided but we're offline, save the uri for later upload
          if (documentUri && !isOnline) {
            updatedData.pendingDocumentUri = documentUri;
          }
          
          return { 
            ...todo, 
            ...updatedData, 
            pendingSync: !isOnline || id.startsWith('local_') 
          };
        }
        return todo;
      });
      
      await this.saveToLocalStorage(updatedTodos);
      return updatedTodos;
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  }

  // Delete a todo
  async deleteTodo(id) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const isOnline = await this.isOnline();
      
      // Get the todo to check if it has a document
      const todos = await this.getFromLocalStorage();
      const todoToDelete = todos.find(todo => todo.id === id);
      
      if (isOnline && !id.startsWith('local_')) {
        // Delete from Firestore
        await deleteDoc(doc(db, 'todos', id));
        
        // If there's an associated document, delete it from Cloudinary too
        if (todoToDelete && todoToDelete.documentId) {
          try {
            await CloudinaryService.deleteDocument(todoToDelete.documentId);
          } catch (docError) {
            console.error('Error deleting document from Cloudinary:', docError);
            // Continue with the todo deletion even if document deletion fails
          }
        }
      }
      
      // Delete from local storage
      const filteredTodos = todos.filter(todo => todo.id !== id);
      await this.saveToLocalStorage(filteredTodos);
      return filteredTodos;
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  }

  // Get a single todo by ID
  async getTodoById(id) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const todos = await this.getFromLocalStorage();
      return todos.find(todo => todo.id === id) || null;
    } catch (error) {
      console.error('Error getting todo by ID:', error);
      return null;
    }
  }

  // Sync pending offline changes when back online
  async syncOfflineChanges() {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;
      
      const isOnline = await this.isOnline();
      if (!isOnline) return;
      
      const todos = await this.getFromLocalStorage();
      const pendingTodos = todos.filter(todo => todo.pendingSync);
      
      for (const todo of pendingTodos) {
        // Handle document upload if there's a pending document
        if (todo.pendingDocumentUri) {
          try {
            // For local todos that will get a new ID, use a temporary ID for upload
            const uploadId = todo.id.startsWith('local_') ? 
              'temp_' + new Date().getTime() : todo.id;
            
            const uploadResult = await CloudinaryService.uploadDocument(
              todo.pendingDocumentUri, 
              uploadId
            );
            
            if (uploadResult) {
              todo.documentUrl = uploadResult.url;
              todo.documentId = uploadResult.publicId;
            }
            
            // Remove pendingDocumentUri after successful upload
            delete todo.pendingDocumentUri;
          } catch (docError) {
            console.error('Error uploading pending document:', docError);
            // Continue with todo sync even if document upload fails
          }
        }
        
        if (todo.id.startsWith('local_')) {
          // New todo that was created offline
          const { id, pendingSync, pendingDocumentUri, ...todoData } = todo;
          
          // Ensure userId is included
          if (!todoData.userId) {
            todoData.userId = userId;
          }
          
          const docRef = await addDoc(collection(db, 'todos'), todoData);
          
          // If we uploaded a document with a temporary ID, we need to update it
          // In a real implementation, you would update the document ID in Cloudinary
          
          // Update the local copy with the new Firestore ID
          const updatedTodos = todos.map(t => 
            t.id === id ? { ...todo, id: docRef.id, pendingSync: false, pendingDocumentUri: undefined } : t
          );
          await this.saveToLocalStorage(updatedTodos);
        } else {
          // Existing todo that was updated offline
          const { pendingSync, pendingDocumentUri, ...todoData } = todo;
          const todoRef = doc(db, 'todos', todo.id);
          await updateDoc(todoRef, todoData);
          
          // Mark as synced
          const updatedTodos = todos.map(t => 
            t.id === todo.id ? { ...todo, pendingSync: false, pendingDocumentUri: undefined } : t
          );
          await this.saveToLocalStorage(updatedTodos);
        }
      }
    } catch (error) {
      console.error('Error syncing offline changes:', error);
    }
  }
}

export default new TodoService();