import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Modal,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import DashboardHeader from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebase';
// Added 'or' from firestore for the combined query
import { doc, getDoc, collection, query, where, onSnapshot, deleteDoc, or } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [liveEvents, setLiveEvents] = useState([]); 
    const [pastEvents, setPastEvents] = useState([]);
    const [showPastModal, setShowPastModal] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        fetchUserData();
        setGreetingMessage();

        const user = auth.currentUser;
        if (user) {
            // --- UPDATED QUERY ---
            // This now fetches events where you are the owner OR your email is in the collaborators list
            const q = query(
                collection(db, 'events'), 
                or(
                    where('userId', '==', user.uid),
                    where('collaborators', 'array-contains', user.email.toLowerCase())
                )
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const limitDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
                const threeMonthsLimit = limitDate.getTime();

                const allData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setTotalCount(allData.length);

                const live = [];
                const future = [];
                const past = [];

                allData.forEach(event => {
                    const eventTime = parseCustomDate(event.startDate || event.date);
                    const endTime = event.endDate ? parseCustomDate(event.endDate) : eventTime;

                    if (!eventTime || isNaN(eventTime)) return;

                    if (endTime < today) {
                        past.push(event);
                    } else if (eventTime <= today && endTime >= today) {
                        live.push(event);
                    } else if (eventTime > today && eventTime <= threeMonthsLimit) {
                        future.push(event);
                    }
                });

                const sortByDate = (a, b) => parseCustomDate(a.startDate) - parseCustomDate(b.startDate);
                setLiveEvents(live.sort(sortByDate));
                setUpcomingEvents(future.sort(sortByDate));
                setPastEvents(past.sort((a, b) => parseCustomDate(b.startDate) - parseCustomDate(a.startDate)));
                setLoading(false);
            }, (error) => {
                console.error("Snapshot Error:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, []);

    const parseCustomDate = (dateVal) => {
        if (!dateVal) return null;
        if (dateVal.seconds) return new Date(dateVal.seconds * 1000).setHours(0,0,0,0);
        if (typeof dateVal === 'string') {
            const monthMap = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
            const parts = dateVal.replace(',', '').split(' ');
            if (parts.length === 3) {
                const month = monthMap[parts[0].toLowerCase().substring(0,3)];
                if (month !== undefined) {
                    return new Date(parts[2], month, parts[1]).setHours(0,0,0,0);
                }
            }
        }
        return new Date(dateVal).setHours(0,0,0,0);
    };

    const formatDateRange = (start, end) => {
        if (!start) return 'No Date';
        if (!end || start === end) return start;
        const endParts = end.split(', ');
        return `${start.split(',')[0]} - ${endParts[0]}, ${endParts[1]}`;
    };

    const deleteEvent = async (eventId) => {
        // Find the event to check ownership
        const eventToDelete = pastEvents.find(e => e.id === eventId);
        const isOwner = eventToDelete?.userId === auth.currentUser?.uid;

        const message = isOwner 
            ? "Are you sure you want to delete this event?" 
            : "You are a collaborator. Remove this event from your list?";

        Alert.alert("Remove Event", message, [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: async () => {
                if (isOwner) {
                    await deleteDoc(doc(db, 'events', eventId));
                } else {
                    // Logic to just remove yourself from the collaborator list instead of deleting the whole event
                    const docRef = doc(db, 'events', eventId);
                    const updatedCollabs = eventToDelete.collaborators.filter(email => email !== auth.currentUser.email.toLowerCase());
                    await updateDoc(docRef, { collaborators: updatedCollabs });
                }
            }}
        ]);
    };

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
                if (userDoc.exists()) setUserData(userDoc.data());
            }
        } catch (error) {
            console.error('User Fetch Error:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    const stats = [
        { label: 'Total Events', value: totalCount.toString(), icon: 'calendar', color: '#00686F' },
        { label: 'Next 3 Months', value: (upcomingEvents.length + liveEvents.length).toString(), icon: 'time', color: '#0891B2' },
        { label: 'Guests', value: '0', icon: 'people', color: '#059669' },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00686F" />}
            >
                <DashboardHeader userData={userData} greeting={greeting} navigation={navigation} />

                <View style={styles.statsContainer}>
                    <View style={styles.statsCard}>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {stats.map((stat) => (
                                <View key={stat.label} style={{ width: '50%', paddingVertical: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name={stat.icon} size={18} color={stat.color} style={{ marginRight: 8 }} />
                                        <CustomText style={styles.statLabel}>{stat.label}</CustomText>
                                    </View>
                                    <CustomText style={styles.statValue}>{stat.value}</CustomText>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.sectionContainer}>
                    <CustomText style={styles.sectionTitle}>Quick Actions</CustomText>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => setShowPastModal(true)}>
                            <Ionicons name="time-outline" size={24} color="#6B7280" />
                            <CustomText style={styles.actionText}>Past Events</CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('MyEvents')}>
                            <Ionicons name="list-outline" size={24} color="#0891B2" />
                            <CustomText style={styles.actionText}>My Events</CustomText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Venues')}>
                            <Ionicons name="business-outline" size={24} color="#059669" />
                            <CustomText style={styles.actionText}>Venues</CustomText>
                        </TouchableOpacity>
                    </View>
                </View>

                {liveEvents.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.liveHeader}>
                            <CustomText style={styles.sectionTitle}>Happening Now</CustomText>
                            <View style={styles.liveBadge}>
                                <View style={styles.pulseDot} />
                                <CustomText style={styles.liveText}>LIVE</CustomText>
                            </View>
                        </View>
                        {liveEvents.map((item) => (
                            <TouchableOpacity key={item.id} style={[styles.eventCard, styles.liveCard]} 
                                onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}>
                                <View style={[styles.eventIconContainer, {backgroundColor: '#FEE2E2'}]}>
                                    <Ionicons name="flash" size={24} color="#EF4444" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <CustomText style={styles.eventTitle}>{item.title}</CustomText>
                                    <CustomText style={styles.liveDateText}>{formatDateRange(item.startDate, item.endDate)}</CustomText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={[styles.sectionContainer, { marginBottom: 100 }]}>
                    <CustomText style={styles.sectionTitle}>Upcoming Events</CustomText>
                    {loading ? (
                        <ActivityIndicator color="#00686F" />
                    ) : upcomingEvents.length > 0 ? (
                        upcomingEvents.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.eventCard} 
                                onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}>
                                <View style={styles.eventIconContainer}>
                                    <Ionicons name="calendar" size={24} color="#00686F" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <CustomText style={styles.eventTitle}>{item.title}</CustomText>
                                    <CustomText style={styles.eventDate}>{formatDateRange(item.startDate, item.endDate)}</CustomText>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <CustomText style={styles.emptyText}>No upcoming events</CustomText>
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal visible={showPastModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <CustomText style={styles.modalTitle}>Past Events Archive</CustomText>
                            <TouchableOpacity onPress={() => setShowPastModal(false)}>
                                <Ionicons name="close" size={28} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={pastEvents}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.pastEventItem}>
                                    <View style={{ flex: 1 }}>
                                        <CustomText style={styles.pastTitle}>{item.title}</CustomText>
                                        <CustomText style={styles.pastDate}>{item.startDate}</CustomText>
                                    </View>
                                    <TouchableOpacity onPress={() => deleteEvent(item.id)}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            ListEmptyComponent={<CustomText style={styles.emptyText}>No past events to show.</CustomText>}
                        />
                    </View>
                </View>
            </Modal>

            <TouchableOpacity 
                style={styles.fab} 
                onPress={() => navigation.navigate('AddEvent')}
            >
                <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // (Styles remain identical to yours)
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        backgroundColor: '#00686F',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    container: { flex: 1, backgroundColor: '#EFF0EE' },
    statsContainer: { paddingHorizontal: 20, marginTop: -20 },
    statsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, elevation: 3 },
    statLabel: { fontSize: 12, color: '#6B7280' },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginLeft: 26 },
    sectionContainer: { paddingHorizontal: 20, marginTop: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    actionButton: { width: (width - 64) / 3, backgroundColor: '#FFF', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 1 },
    actionText: { fontSize: 12, marginTop: 8, textAlign: 'center' },
    liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginRight: 6 },
    liveText: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },
    liveCard: { borderColor: '#FECACA', borderWidth: 1 },
    liveDateText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
    eventCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    eventIconContainer: { backgroundColor: '#F0F9FA', borderRadius: 10, marginRight: 15, width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
    eventTitle: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
    eventDate: { color: '#6B7280', fontSize: 13 },
    emptyState: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, alignItems: 'center' },
    emptyText: { color: '#9CA3AF' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', height: height * 0.7, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    pastEventItem: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
    pastTitle: { fontWeight: 'bold', fontSize: 16 },
    pastDate: { color: '#6B7280', fontSize: 12 }
});