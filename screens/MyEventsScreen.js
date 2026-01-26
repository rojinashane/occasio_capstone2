import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import CustomText from '../components/CustomText';

export default function MyEventsScreen({ navigation }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const parseDateToNumber = (dateStr) => {
        if (!dateStr) return 0;
        const monthMap = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
        const parts = String(dateStr).replace(',', '').split(' ');
        if (parts.length === 3) {
            return new Date(parts[2], monthMap[parts[0].toLowerCase().substring(0,3)], parts[1]).setHours(0,0,0,0);
        }
        return new Date(dateStr).setHours(0,0,0,0);
    };

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        const q = query(collection(db, 'events'), where('userId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            
            const eventsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(event => {
                const endTs = event.endDate ? parseDateToNumber(event.endDate) : parseDateToNumber(event.startDate);
                return endTs >= today; // Auto-remove past events
            })
            .sort((a, b) => parseDateToNumber(a.startDate) - parseDateToNumber(b.startDate));

            setEvents(eventsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const formatDateRange = (start, end) => {
        if (!start) return 'No Date';
        if (!end || start === end) return start;
        const startDay = start.split(',')[0];
        return `${startDay} - ${end}`;
    };

    const renderEventItem = ({ item }) => {
        const startTs = parseDateToNumber(item.startDate);
        const endTs = item.endDate ? parseDateToNumber(item.endDate) : startTs;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        // Check if event is happening right now
        const isLive = today >= startTs && today <= endTs;

        return (
            <TouchableOpacity 
                style={[styles.card, isLive && styles.liveCard]}
                onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
            >
                <View style={[styles.iconContainer, isLive && styles.liveIconContainer]}>
                    <Ionicons 
                        name={isLive ? "flash" : "calendar"} 
                        size={24} 
                        color={isLive ? "#EF4444" : "#00686F"} 
                    />
                </View>
                
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <CustomText style={styles.title}>{item.title}</CustomText>
                        {isLive && (
                            <View style={styles.liveBadge}>
                                <CustomText style={styles.liveBadgeText}>LIVE</CustomText>
                            </View>
                        )}
                    </View>
                    <CustomText style={[styles.date, isLive && styles.liveDateText]}>
                        {formatDateRange(item.startDate, item.endDate)}
                    </CustomText>
                </View>
                
                <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={isLive ? "#EF4444" : "#D1D5DB"} 
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <CustomText style={styles.headerTitle}>My Events</CustomText>
                <View style={{ width: 24 }} /> 
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#00686F" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    data={events}
                    keyExtractor={(item) => item.id}
                    renderItem={renderEventItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
                            <CustomText style={{marginTop: 10, color: '#6B7280'}}>No upcoming events.</CustomText>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EFF0EE' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#FFF' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    listContent: { padding: 20 },
    card: { 
        backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, 
        flexDirection: 'row', alignItems: 'center', elevation: 2,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
    },
    liveCard: { borderColor: '#FECACA', borderWidth: 1, backgroundColor: '#FFFBFB' },
    iconContainer: { backgroundColor: '#F0F9FA', borderRadius: 10, marginRight: 15, width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
    liveIconContainer: { backgroundColor: '#FEE2E2' },
    title: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
    date: { color: '#6B7280', fontSize: 13, marginTop: 2 },
    liveDateText: { color: '#EF4444', fontWeight: '600' },
    liveBadge: { backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
    liveBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
    emptyState: { alignItems: 'center', marginTop: 50 }
});