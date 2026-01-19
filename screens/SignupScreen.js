// screens/SignupScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import CustomText from '../components/CustomText';
import { Ionicons } from '@expo/vector-icons';

// Firebase
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SignupScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [lastname, setLastname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    // 1. Validation Logic
    if (!firstname.trim() || !lastname.trim() || !username.trim() || !email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please fill in all fields marked with *');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password should be at least 6 characters.');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 2. Create User
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // 3. Write to Firestore while authenticated
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        firstName: firstname.trim(),
        middleName: middlename.trim(),
        lastName: lastname.trim(),
        username: username.trim(),
        email: cleanEmail,
        createdAt: serverTimestamp(),
        uid: user.uid,
      });

      // 4. Verification Flow
      await sendEmailVerification(user);

      // Sign out immediately so they must verify before logging in
      await signOut(auth);

      Alert.alert(
        'Verify Email',
        'Account created! Please check your inbox and verify your email address before logging in.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );

    } catch (err) {
      console.error('Signup failed:', err);
      Alert.alert('Signup Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#00686F]`}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
        <ScrollView contentContainerStyle={tw`flex-grow p-6`}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }}>
            <CustomText fontFamily="Poppins-SemiBold" style={tw`text-white text-3xl text-center mb-4`}>
              Create Account
            </CustomText>

            <TextInput placeholder="First Name*" value={firstname} onChangeText={setFirstname} style={tw`bg-gray-100 rounded-lg px-4 py-3 mb-3`} />
            <TextInput placeholder="Middle Name (Optional)" value={middlename} onChangeText={setMiddlename} style={tw`bg-gray-100 rounded-lg px-4 py-3 mb-3`} />
            <TextInput placeholder="Last Name*" value={lastname} onChangeText={setLastname} style={tw`bg-gray-100 rounded-lg px-4 py-3 mb-3`} />
            <TextInput placeholder="Username*" value={username} onChangeText={setUsername} style={tw`bg-gray-100 rounded-lg px-4 py-3 mb-3`} />
            <TextInput placeholder="Gmail*" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={tw`bg-gray-100 rounded-lg px-4 py-3 mb-3`} />

            <View style={tw`relative mb-4`}>
              <TextInput
                placeholder="Password*"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={tw`bg-gray-100 rounded-lg px-4 py-3 text-black`}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={tw`absolute right-4 top-3`}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleSignup} disabled={loading} style={tw`bg-[#00686F] py-3 rounded-lg mb-3 border border-white`}>
              {loading ? <ActivityIndicator color="#fff" /> : <CustomText style={tw`text-white text-center`}>Sign Up</CustomText>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <CustomText style={tw`text-center text-gray-200 mt-2`}>
                Already have an account? <CustomText style={tw`font-bold text-white`}>Login</CustomText>
              </CustomText>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}