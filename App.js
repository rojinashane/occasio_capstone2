import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { auth } from './firebase';
import { onAuthStateChanged, reload } from 'firebase/auth';

// Screens
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import DashboardScreen from './screens/DashboardScreen';
import AddEvent from './components/AddEvent';
import MyEventsScreen from './screens/MyEventsScreen'; 
import EventDetailsScreen from './screens/EventDetailsScreen';
import UpdateEvent from './components/UpdateEvent'; // ✅ ADD THIS IMPORT

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await reload(user);
          if (user.emailVerified) {
            setInitialRoute('Dashboard');
          } else {
            setInitialRoute('Landing');
          }
        } catch (e) {
          setInitialRoute('Landing');
        }
      } else {
        setInitialRoute('Landing');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF0EE' }}>
        <ActivityIndicator size="large" color="#00686F" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="AddEvent" component={AddEvent} />
        <Stack.Screen name="MyEvents" component={MyEventsScreen} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} /> 
        {/* ✅ REGISTERED THE UPDATE SCREEN HERE */}
        <Stack.Screen name="UpdateEvent" component={UpdateEvent} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}