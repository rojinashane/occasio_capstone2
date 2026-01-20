import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const features = [
    {
      icon: 'cube-outline',
      title: 'AR Venue Tours',
      description: 'Experience venues in augmented reality',
      color: '#00686F',
    },
    {
      icon: 'partly-sunny-outline',
      title: 'Smart Weather',
      description: 'AI-powered weather forecasts',
      color: '#0891B2',
    },
    {
      icon: 'people-outline',
      title: 'RSVP Tracking',
      description: 'Manage guests effortlessly',
      color: '#059669',
    },
    {
      icon: 'calendar-outline',
      title: 'Event Planning',
      description: 'Organize every detail perfectly',
      color: '#DC2626',
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EFF0EE' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#EFF0EE" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Hero Section */}
        <Animated.View
          style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideUpAnim }],
          }}
        >
          {/* Logo Section */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Animated.View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: '#00686F',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
                transform: [{ scale: scaleAnim }, { rotate: spin }],
                shadowColor: '#00686F',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Ionicons name="calendar" size={50} color="#EFF0EE" />
            </Animated.View>

            <CustomText
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: '#00686F',
                marginBottom: 8,
                letterSpacing: 1,
              }}
            >
              Occasio
            </CustomText>
            <CustomText
              style={{
                fontSize: 15,
                color: '#6B7280',
                textAlign: 'center',
                letterSpacing: 0.5,
              }}
            >
              Event planning perfected
            </CustomText>
          </View>

          {/* Main Description */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 5,
            }}
          >
            <CustomText
              style={{
                fontSize: 22,
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              Welcome to Occasio
            </CustomText>
            <CustomText
              style={{
                fontSize: 15,
                color: '#6B7280',
                lineHeight: 24,
                textAlign: 'center',
              }}
            >
              Your smart partner in effortless event planning. Experience virtual
              venue visits with AR, smart weather forecasts, RSVP tracking, and
              more — all in one app.
            </CustomText>
          </View>

          {/* Features Grid */}
          <View style={{ marginBottom: 24 }}>
            <CustomText
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              Key Features
            </CustomText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {features.map((feature, index) => (
                <Animated.View
                  key={index}
                  style={{
                    width: (width - 60) / 2,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: `${feature.color}15`,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons name={feature.icon} size={26} color={feature.color} />
                  </View>
                  <CustomText
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 6,
                    }}
                  >
                    {feature.title}
                  </CustomText>
                  <CustomText
                    style={{
                      fontSize: 12,
                      color: '#6B7280',
                      lineHeight: 16,
                    }}
                  >
                    {feature.description}
                  </CustomText>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ marginTop: 'auto', paddingBottom: 20 }}>
            {/* Login Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#00686F',
                borderRadius: 16,
                paddingVertical: 16,
                marginBottom: 12,
                shadowColor: '#00686F',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <CustomText
                style={{
                  color: '#EFF0EE',
                  fontSize: 17,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                Login
              </CustomText>
            </TouchableOpacity>

            {/* Signup Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              activeOpacity={0.85}
              style={{
                borderColor: '#00686F',
                borderWidth: 2,
                borderRadius: 16,
                paddingVertical: 16,
                backgroundColor: '#FFFFFF',
              }}
            >
              <CustomText
                style={{
                  color: '#00686F',
                  fontSize: 17,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                Sign Up
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* Social Links */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <CustomText
              style={{
                fontSize: 13,
                color: '#9CA3AF',
                marginBottom: 16,
              }}
            >
              Follow us on
            </CustomText>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {[
                { name: 'logo-facebook', color: '#1877F2' },
                { name: 'logo-twitter', color: '#1DA1F2' },
                { name: 'logo-instagram', color: '#E4405F' },
              ].map((social, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#FFFFFF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={social.name} size={24} color={social.color} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
