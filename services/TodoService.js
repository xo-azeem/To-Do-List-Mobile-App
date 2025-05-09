// services/TodoService.js
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, getDocs, where } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../firebase';
import NetInfo from '@react-native-community/netinfo';
import { getAuth } from 'firebase/auth';

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

  // Add a new todo
  async addTodo(title) {
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
      };
      
      if (isOnline) {
        // Add to Firestore
        const docRef = await addDoc(collection(db, 'todos'), newTodo);
        newTodo.id = docRef.id;
        
        // Update local storage
        const todos = await this.getFromLocalStorage();
        todos.unshift(newTodo);
        await this.saveToLocalStorage(todos);
      } else {
        // Add to local storage only with a temporary ID
        newTodo.id = 'local_' + new Date().getTime();
        newTodo.pendingSync = true;
        
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
  async updateTodo(id, updates) {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const isOnline = await this.isOnline();
      
      if (isOnline && !id.startsWith('local_')) {
        // Update in Firestore
        const todoRef = doc(db, 'todos', id);
        await updateDoc(todoRef, updates);
      }
      
      // Update in local storage
      const todos = await this.getFromLocalStorage();
      const updatedTodos = todos.map(todo => {
        if (todo.id === id) {
          return { ...todo, ...updates, pendingSync: !isOnline || id.startsWith('local_') };
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
      
      if (isOnline && !id.startsWith('local_')) {
        // Delete from Firestore
        await deleteDoc(doc(db, 'todos', id));
      }
      
      // Delete from local storage
      const todos = await this.getFromLocalStorage();
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
        if (todo.id.startsWith('local_')) {
          // New todo that was created offline
          const { id, pendingSync, ...todoData } = todo;
          
          // Ensure userId is included
          if (!todoData.userId) {
            todoData.userId = userId;
          }
          
          const docRef = await addDoc(collection(db, 'todos'), todoData);
          
          // Update the local copy with the new Firestore ID
          const updatedTodos = todos.map(t => 
            t.id === id ? { ...todo, id: docRef.id, pendingSync: false } : t
          );
          await this.saveToLocalStorage(updatedTodos);
        } else {
          // Existing todo that was updated offline
          const { pendingSync, ...todoData } = todo;
          const todoRef = doc(db, 'todos', todo.id);
          await updateDoc(todoRef, todoData);
          
          // Mark as synced
          const updatedTodos = todos.map(t => 
            t.id === todo.id ? { ...todo, pendingSync: false } : t
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