import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import CustomText from './CustomText';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function DashboardHeader({ userData, greeting, navigation }) {
    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            navigation.replace('Landing');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleNotifications = () => {
        Alert.alert('Notifications', 'No new notifications');
    };

    return (
        <View
            style={{
                backgroundColor: '#00686F',
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 30,
                borderBottomLeftRadius: 24,
                borderBottomRightRadius: 24,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* User Info */}
                <View style={{ flex: 1 }}>
                    <CustomText style={{ fontSize: 16, color: '#D1FAE5', marginBottom: 4 }}>
                        {greeting}!
                    </CustomText>
                    <CustomText style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' }}>
                        {userData?.firstName || 'Welcome'}
                    </CustomText>
                    <CustomText style={{ fontSize: 13, color: '#D1FAE5', marginTop: 2 }}>
                        @{userData?.username || 'user'}
                    </CustomText>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Notifications Button */}
                    <TouchableOpacity
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        onPress={handleNotifications}
                    >
                        <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
