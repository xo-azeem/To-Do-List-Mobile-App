// services/UserService.js
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Creates a user profile in Firestore
 * @param {string} uid - User ID from Firebase Auth
 * @param {string} name - User's full name
 * @param {string} email - User's email address
 * @returns {Promise<boolean>} Success status
 */
export const createUserProfile = async (uid, name, email) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      id: uid,
      name,
      email,
      role: 'user',
      image: null,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    console.log('User profile created successfully');
    return true;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Retrieves a user profile from Firestore
 * @param {string} uid - User ID from Firebase Auth
 * @returns {Promise<Object|null>} User data or null if not found
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      return { id: userSnapshot.id, ...userSnapshot.data() };
    }
    console.log('No user profile found');
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Updates user profile data in Firestore
 * @param {string} uid - User ID from Firebase Auth
 * @param {Object} data - User data to update
 * @returns {Promise<boolean>} Success status
 */
export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date(),
    });
    console.log('User profile updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Updates user's last login timestamp
 * @param {string} uid - User ID from Firebase Auth
 * @returns {Promise<boolean>} Success status
 */
export const updateLastLogin = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastLogin: new Date()
    });
    console.log('Last login updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};