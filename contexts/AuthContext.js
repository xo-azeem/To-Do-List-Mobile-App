// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, updateLastLogin } from '../services/UserService';
import { router } from 'expo-router';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if email is verified
        if (!user.emailVerified) {
          // If not verified, don't load user profile
          setLoading(false);
          return;
        }
        
        try {
          // Get user profile data
          const profile = await getUserProfile(user.uid);
          
          if (profile) {
            setUserProfile(profile);
            // Update last login timestamp when user signs in
            await updateLastLogin(user.uid);
          } else {
            console.warn('No user profile found for authenticated user');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    isEmailVerified: currentUser?.emailVerified || false
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}