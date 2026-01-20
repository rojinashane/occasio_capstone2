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

    const quickActions = [
        { id: 1, title: 'Create Event', icon: 'add-circle-outline', color: '#00686F', screen: 'AddEvent' },
        { id: 2, title: 'My Events', icon: 'list-outline', color: '#0891B2', screen: 'MyEvents' },
        { id: 3, title: 'Venues', icon: 'business-outline', color: '#059669', screen: 'Venues' },
    ];

    const stats = [
        { label: 'Total Events', value: '0', icon: 'calendar', color: '#00686F' },
        { label: 'Upcoming', value: '0', icon: 'time', color: '#0891B2' },
        { label: 'Guests', value: '0', icon: 'people', color: '#059669' },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#EFF0EE' }} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00686F" />}
            >
                <DashboardHeader userData={userData} greeting={greeting} navigation={navigation} />

                {/* Stats Section */}
                <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, elevation: 3 }}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {stats.map((stat, index) => (
                                <View key={stat.label} style={{ width: '50%', paddingVertical: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name={stat.icon} size={18} color={stat.color} style={{ marginRight: 8 }} />
                                        <CustomText style={{ fontSize: 12, color: '#6B7280' }}>{stat.label}</CustomText>
                                    </View>
                                    <CustomText style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginLeft: 26 }}>{stat.value}</CustomText>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                    <CustomText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Quick Actions</CustomText>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        {quickActions.map((action) => (
                            <TouchableOpacity
                                key={action.id}
                                style={{ width: (width - 64) / 3, backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center' }}
                                onPress={() => action.screen ? navigation.navigate(action.screen) : Alert.alert('Coming Soon')}
                            >
                                <Ionicons name={action.icon} size={24} color={action.color} />
                                <CustomText style={{ fontSize: 12, marginTop: 8 }}>{action.title}</CustomText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Upcoming Events Empty State */}
                <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 32, alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
                        <CustomText style={{ fontSize: 16, fontWeight: '600', marginVertical: 8 }}>No Upcoming Events</CustomText>
                        <TouchableOpacity
                            style={{ backgroundColor: '#00686F', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
                            onPress={() => navigation.navigate('AddEvent')}
                        >
                            <CustomText style={{ color: '#FFFFFF', fontWeight: '600' }}>Create Your First Event</CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={{ position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: '#00686F', justifyContent: 'center', alignItems: 'center', elevation: 6 }}
                onPress={() => navigation.navigate('AddEvent')}
            >
                <Ionicons name="add" size={32} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}