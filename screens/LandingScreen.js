// screens/LandingScreen.js
import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  Easing,
  SafeAreaView,
  Image,
  Text,
  Dimensions,
  ScrollView,
} from 'react-native';
import tw from 'twrnc';
import CustomText from '../components/CustomText';
import { FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(80)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Run animations safely
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const logoSize = Math.min(width * 0.3, 120);
  const socialSize = Math.min(width * 0.13, 56);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#00686F' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        {/* TOP SECTION */}
        <View style={tw`bg-[#00686F] items-center justify-center py-20`}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }, { scale: scaleAnim }],
              alignItems: 'center',
            }}
          >
            <Image
              source={require('../assets/logo/Logo.png')}
              style={{ width: logoSize, height: logoSize, marginBottom: height * 0.02 }}
              resizeMode="contain"
            />

            <Text
              style={{
                fontFamily: 'LilyScriptOne',
                fontSize: Math.min(width * 0.12, 48),
                lineHeight: Math.min(width * 0.15, 56),
                color: 'white',
                marginBottom: height * 0.01,
              }}
            >
              Occasio
            </Text>

            <CustomText
              fontFamily="Poppins-Light"
              style={{
                color: 'white',
                fontSize: Math.min(width * 0.04, 16),
                textAlign: 'center',
                paddingHorizontal: width * 0.12,
              }}
            >
              Event planning perfected
            </CustomText>
          </Animated.View>
        </View>

        {/* BOTTOM SECTION */}
        <Animated.View
          style={[
            tw`bg-white px-6 pt-8`,
            {
              minHeight: height * 0.55,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <CustomText
            fontFamily="Poppins-SemiBold"
            style={{
              fontSize: Math.min(width * 0.065, 26),
              textAlign: 'center',
              color: '#00686F',
              marginBottom: height * 0.01,
            }}
          >
            Welcome to Occasio
          </CustomText>

          <CustomText
            fontFamily="Poppins-Regular"
            style={{
              color: '#4B5563',
              fontSize: Math.min(width * 0.04, 16),
              textAlign: 'center',
              marginBottom: height * 0.03,
              lineHeight: Math.min(width * 0.06, 24),
              paddingHorizontal: width * 0.05,
            }}
          >
            Your smart partner in effortless event planning. Experience virtual
            venue visits with AR, smart weather forecasts, RSVP tracking, and
            more — all in one app.
          </CustomText>

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#00686F',
              paddingVertical: Math.min(height * 0.02, 16),
              borderRadius: 999,
              marginBottom: height * 0.015,
            }}
          >
            <CustomText
              fontFamily="Poppins-SemiBold"
              style={{
                textAlign: 'center',
                color: 'white',
                fontSize: Math.min(width * 0.045, 18),
              }}
            >
              Login
            </CustomText>
          </TouchableOpacity>

          {/* SIGNUP BUTTON */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.8}
            style={{
              borderColor: '#00686F',
              borderWidth: 2,
              paddingVertical: Math.min(height * 0.02, 16),
              borderRadius: 999,
            }}
          >
            <CustomText
              fontFamily="Poppins-SemiBold"
              style={{
                textAlign: 'center',
                color: '#00686F',
                fontSize: Math.min(width * 0.045, 18),
              }}
            >
              Sign Up
            </CustomText>
          </TouchableOpacity>

          {/* SOCIAL ICONS */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginVertical: height * 0.04,
            }}
          >
            {['facebook', 'twitter', 'instagram'].map((icon) => (
              <TouchableOpacity key={icon} style={{ marginHorizontal: 12 }}>
                <View
                  style={{
                    width: socialSize,
                    height: socialSize,
                    borderRadius: socialSize / 2,
                    backgroundColor: 'rgba(0,104,111,0.1)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <FontAwesome
                    name={icon}
                    size={Math.min(width * 0.06, 24)}
                    color="#00686F"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
