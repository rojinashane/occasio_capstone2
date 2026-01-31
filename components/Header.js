import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import CustomText from './CustomText';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardHeader({ userData, greeting, onOpenMenu }) {
    return (
        <View style={styles.headerBody}>
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
                    <TouchableOpacity 
                        style={styles.iconCircle} 
                        onPress={() => alert('Notifications coming soon!')}
                    >
                        <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* HAMBURGER MENU BUTTON */}
                    <TouchableOpacity style={styles.iconCircle} onPress={onOpenMenu}>
                        <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerBody: {
        backgroundColor: '#00686F',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});