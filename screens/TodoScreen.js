// app/(tabs)/index.js or index.tsx
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';  // Note the different path
import TodoItem from '../../components/TodoItem';  // Note the different path
import AddTodo from '../../components/AddTodo';  // Note the different path

export default function TodoScreen() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'todos'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const todoList = [];
      querySnapshot.forEach((doc) => {
        todoList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setTodos(todoList);
      setLoading(false);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Todo List</Text>
      <AddTodo />
      {todos.length > 0 ? (
        <FlatList
          data={todos}
          renderItem={({ item }) => (
            <TodoItem
              id={item.id}
              title={item.title}
              completed={item.completed}
            />
          )}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks yet. Add one!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
});