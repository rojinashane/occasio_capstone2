import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import DashboardHeader from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        fetchUserData();
        setGreetingMessage();
    }, []);

    const setGreetingMessage = () => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');
    };

    const fetchUserData = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    // Feature Cards Data
    const features = [
        {
            id: 1,
            title: 'AR Venue Tour',
            description: 'Virtual venue visits with augmented reality',
            icon: 'cube-outline',
            color: '#00686F',
            screen: 'ARVenue',
        },
        {
            id: 2,
            title: 'Weather Forecast',
            description: 'Smart weather predictions for your event',
            icon: 'partly-sunny-outline',
            color: '#0891B2',
            screen: 'Weather',
        },
        {
            id: 3,
            title: 'RSVP Tracking',
            description: 'Manage guest responses efficiently',
            icon: 'people-outline',
            color: '#059669',
            screen: 'RSVP',
        },
        {
            id: 4,
            title: 'Event Planner',
            description: 'Create and organize your events',
            icon: 'calendar-outline',
            color: '#DC2626',
            screen: 'EventPlanner',
        },
    ];

    // Quick Actions Data
    const quickActions = [
        {
            id: 1,
            title: 'Create Event',
            icon: 'add-circle-outline',
            color: '#00686F',
        },
        {
            id: 2,
            title: 'My Events',
            icon: 'list-outline',
            color: '#0891B2',
        },
        {
            id: 3,
            title: 'Venues',
            icon: 'business-outline',
            color: '#059669',
        },
        {
            id: 4,
            title: 'Budget',
            icon: 'wallet-outline',
            color: '#F59E0B',
        },
    ];

    // Stats Data
    const stats = [
        { label: 'Total Events', value: '0', icon: 'calendar', color: '#00686F' },
        { label: 'Upcoming', value: '0', icon: 'time', color: '#0891B2' },
        { label: 'Guests', value: '0', icon: 'people', color: '#059669' },
        { label: 'Budget', value: '₱0', icon: 'cash', color: '#F59E0B' },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#EFF0EE' }} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00686F" />
                }
            >
                {/* Separated Header Component */}
                <DashboardHeader userData={userData} greeting={greeting} navigation={navigation} />

                {/* Stats Section */}
                <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
                    <View
                        style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 16,
                            padding: 16,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                        }}
                    >
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {stats.map((stat, index) => (
                                <View
                                    key={stat.label}
                                    style={{
                                        width: '50%',
                                        paddingVertical: 12,
                                        paddingHorizontal: 8,
                                        borderRightWidth: index % 2 === 0 ? 1 : 0,
                                        borderBottomWidth: index < 2 ? 1 : 0,
                                        borderColor: '#E5E7EB',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                        <View
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 8,
                                                backgroundColor: `${stat.color}15`,
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 8,
                                            }}
                                        >
                                            <Ionicons name={stat.icon} size={18} color={stat.color} />
                                        </View>
                                        <CustomText style={{ fontSize: 12, color: '#6B7280' }}>
                                            {stat.label}
                                        </CustomText>
                                    </View>
                                    <CustomText style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginLeft: 40 }}>
                                        {stat.value}
                                    </CustomText>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                    <CustomText style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                        Quick Actions
                    </CustomText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={{
                                    width: (width - 52) / 2,
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: 12,
                                    padding: 16,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}
                                activeOpacity={0.7}
                                onPress={() => Alert.alert(action.title, 'Feature coming soon!')}
                            >
                                <View
                                    style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        backgroundColor: `${action.color}15`,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginBottom: 10,
                                    }}
                                >
                                    <Ionicons name={action.icon} size={24} color={action.color} />
                                </View>
                                <CustomText style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                    {action.title}
                                </CustomText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Main Features */}
                <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                    <CustomText style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                        Features
                    </CustomText>
                    {features.map((feature) => (
                        <TouchableOpacity
                            key={feature.id}
                            style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 4,
                                elevation: 2,
                            }}
                            activeOpacity={0.7}
                            onPress={() => Alert.alert(feature.title, 'Feature coming soon!')}
                        >
                            <View
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 14,
                                    backgroundColor: `${feature.color}15`,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginRight: 14,
                                }}
                            >
                                <Ionicons name={feature.icon} size={28} color={feature.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <CustomText style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 }}>
                                    {feature.title}
                                </CustomText>
                                <CustomText style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                                    {feature.description}
                                </CustomText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Upcoming Events Section */}
                <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 32 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <CustomText style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                            Upcoming Events
                        </CustomText>
                        <TouchableOpacity>
                            <CustomText style={{ fontSize: 14, color: '#00686F', fontWeight: '600' }}>
                                See All
                            </CustomText>
                        </TouchableOpacity>
                    </View>

                    {/* Empty State */}
                    <View
                        style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 12,
                            padding: 32,
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                            elevation: 2,
                        }}
                    >
                        <View
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                backgroundColor: '#F3F4F6',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: 16,
                            }}
                        >
                            <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
                        </View>
                        <CustomText style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 }}>
                            No Upcoming Events
                        </CustomText>
                        <CustomText style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
                            Start planning your first event and bring your vision to life!
                        </CustomText>
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#00686F',
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 10,
                            }}
                            onPress={() => Alert.alert('Create Event', 'Feature coming soon!')}
                        >
                            <CustomText style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>
                                Create Your First Event
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    bottom: 24,
                    right: 24,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: '#00686F',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#00686F',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                }}
                onPress={() => Alert.alert('Create Event', 'Feature coming soon!')}
                activeOpacity={0.85}
            >
                <Ionicons name="add" size={32} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
