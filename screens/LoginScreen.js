import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Animated,
    Easing,
    ActivityIndicator,
    ScrollView,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, reload } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Missing Fields', 'Please enter both email and password.');
            return;
        }

        if (loading) return;
        setLoading(true);

        try {
            const cleanEmail = email.trim().toLowerCase();
            const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
            const user = userCredential.user;

            await reload(user);

            if (!user.emailVerified) {
                Alert.alert(
                    'Email Not Verified',
                    'Please verify your email before logging in. Check your inbox.'
                );
                return;
            }

            navigation.replace('Dashboard');
        } catch (err) {
            console.error('Login failed:', err);
            let errorMessage = 'An error occurred. Please try again.';

            if (err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password.';
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Try again later.';
            }

            Alert.alert('Login Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#EFF0EE' }} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24, justifyContent: 'center' }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideUpAnim }],
                        }}
                    >
                        {/* Compact Header */}
                        <View style={{ marginBottom: 28, alignItems: 'center' }}>
                            <CustomText style={{ fontSize: 28, fontWeight: 'bold', color: '#00686F', marginBottom: 4 }}>
                                Welcome Back
                            </CustomText>
                            <CustomText style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
                                Sign in to continue
                            </CustomText>
                        </View>

                        {/* Email Input */}
                        <View style={{ marginBottom: 14 }}>
                            <CustomText style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
                                Email
                            </CustomText>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingHorizontal: 14,
                                    paddingVertical: 11,
                                    borderWidth: 1.5,
                                    borderColor: '#D1D5DB',
                                }}
                            >
                                <Ionicons name="mail-outline" size={20} color="#00686F" />
                                <TextInput
                                    style={{ flex: 1, marginLeft: 10, fontSize: 15, color: '#111827' }}
                                    placeholder="your@email.com"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="next"
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={{ marginBottom: 24 }}>
                            <CustomText style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>
                                Password
                            </CustomText>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    paddingHorizontal: 14,
                                    paddingVertical: 11,
                                    borderWidth: 1.5,
                                    borderColor: '#D1D5DB',
                                }}
                            >
                                <Ionicons name="lock-closed-outline" size={20} color="#00686F" />
                                <TextInput
                                    style={{ flex: 1, marginLeft: 10, fontSize: 15, color: '#111827' }}
                                    placeholder="Enter password"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#6B7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={loading}
                            style={{
                                backgroundColor: '#00686F',
                                borderRadius: 12,
                                paddingVertical: 14,
                                marginBottom: 16,
                                shadowColor: '#00686F',
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.25,
                                shadowRadius: 6,
                                elevation: 4,
                            }}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#EFF0EE" size="small" />
                            ) : (
                                <CustomText style={{ color: '#EFF0EE', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
                                    Sign In
                                </CustomText>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 18 }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: '#D1D5DB' }} />
                            <CustomText style={{ marginHorizontal: 12, color: '#9CA3AF', fontSize: 13 }}>OR</CustomText>
                            <View style={{ flex: 1, height: 1, backgroundColor: '#D1D5DB' }} />
                        </View>

                        {/* Sign Up Link */}
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Signup')}
                            style={{ paddingVertical: 10 }}
                        >
                            <CustomText style={{ textAlign: 'center', fontSize: 14, color: '#6B7280' }}>
                                Don't have an account?{' '}
                                <CustomText style={{ color: '#00686F', fontWeight: 'bold' }}>
                                    Sign Up
                                </CustomText>
                            </CustomText>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
