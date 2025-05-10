import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getUserProfile } from '../../services/UserService';

export default function LoginScreen() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Import Firebase auth inside component to avoid initialization issues
  const [auth, setAuth] = useState(null);
  
  useEffect(() => {
    // Import auth inside effect
    const { auth: firebaseAuth } = require('../../firebase');
    setAuth(firebaseAuth);
  }, []);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleLogin = async () => {
    const { email, password } = form;
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      // Import functions only when needed
      const { signInWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email before logging in. Do you want us to send a new verification email?',
          [
            {
              text: 'No',
              style: 'cancel',
              onPress: () => auth.signOut(),
            },
            {
              text: 'Yes, Send Again',
              onPress: async () => {
                try {
                  await sendEmailVerification(user);
                  Alert.alert('Success', 'Verification email sent. Please check your inbox.');
                } catch (error) {
                  console.error('Error sending verification email:', error);
                  Alert.alert('Error', 'Failed to send verification email. Please try again later.');
                }
                auth.signOut();
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Get user profile from Firestore
      const userProfile = await getUserProfile(user.uid);
      if (!userProfile) {
        Alert.alert('Error', 'User profile not found in database.');
        setLoading(false);
        return;
      }

      Alert.alert('Success', 'Login successful!');
      router.replace('/(tabs)'); // Navigate to the main app screen
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Login failed. Please check your credentials and try again.';

      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpPress = () => router.push('/auth/signup');
  const handleForgotPassword = () => router.push('/auth/forgot-password');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.logoContainer}>
          <Text style={styles.appTitle}>TaskMaster</Text>
          <Text style={styles.appSubtitle}>Manage your tasks effortlessly</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => updateForm('email', text)}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#95A5A6"
          />

          <TextInput
            placeholder="Password"
            value={form.password}
            onChangeText={(text) => updateForm('password', text)}
            style={styles.input}
            secureTextEntry
            placeholderTextColor="#95A5A6"
          />

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading} accessibilityLabel="Login">
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.loginButtonText}>Login</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignUpPress} style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A6FA5',
    marginBottom: 10,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  formContainer: {
    paddingHorizontal: 30,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  loginButton: {
    backgroundColor: '#4A6FA5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordText: {
    textAlign: 'right',
    marginTop: 5,
    marginBottom: 5,
    color: '#4A6FA5',
    fontSize: 14,
    fontWeight: '500',
  },
  signupContainer: {
    paddingVertical: 12,
  },
  signupText: {
    textAlign: 'center',
    marginTop: 24,
    color: '#6B7280',
    fontSize: 16,
  },
  signupLink: {
    color: '#4A6FA5',
    fontWeight: 'bold',
  },
});