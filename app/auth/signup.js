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
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserProfile } from '../../services/UserService';

export default function SignUpScreen() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
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

  const validateInputs = () => {
    const { name, email, password, confirmPassword } = form;

    if (!name.trim()) return 'Please enter your name.';
    if (!email.trim()) return 'Please enter your email.';
    if (!password) return 'Please enter a password.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (password.length < 6) return 'Password must be at least 6 characters.';

    return null;
  };

  const handleSignUp = async () => {
    const error = validateInputs();
    if (error) return Alert.alert('Error', error);

    setLoading(true);
    try {
      // Import functions only when needed
      const { createUserWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
      
      const { name, email, password } = form;
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
      await createUserProfile(user.uid, name, email);

      Alert.alert(
        'Verification Email Sent',
        'Please check your email to verify your account before logging in.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error) {
      console.error('Signup error:', error);
      let message = 'Failed to create account. Please try again.';

      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'This email is already in use.';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak.';
          break;
      }

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>Sign up to get started with TaskMaster</Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              placeholder="Full Name"
              value={form.name}
              onChangeText={text => updateForm('name', text)}
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
              placeholderTextColor="#95A5A6"
            />

            <TextInput
              placeholder="Email"
              value={form.email}
              onChangeText={text => updateForm('email', text)}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              placeholderTextColor="#95A5A6"
            />

            <TextInput
              placeholder="Password"
              value={form.password}
              onChangeText={text => updateForm('password', text)}
              style={styles.input}
              secureTextEntry
              returnKeyType="next"
              placeholderTextColor="#95A5A6"
            />

            <TextInput
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChangeText={text => updateForm('confirmPassword', text)}
              style={styles.input}
              secureTextEntry
              returnKeyType="done"
              placeholderTextColor="#95A5A6"
            />

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignUp}
              disabled={loading}
              accessibilityLabel="Sign Up"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signupButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already have an account? <Text style={styles.loginLink}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#4A6FA5',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    paddingHorizontal: 30,
    marginBottom: 30,
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
  signupButton: {
    backgroundColor: '#4A6FA5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginContainer: {
    paddingVertical: 12,
  },
  loginText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#6B7280',
    fontSize: 16,
  },
  loginLink: {
    color: '#4A6FA5',
    fontWeight: 'bold',
  },
});