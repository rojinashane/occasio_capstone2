import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
    ActivityIndicator, StatusBar, TextInput, Modal, KeyboardAvoidingView,
    Platform, Alert, Animated, Share 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import CustomText from '../components/CustomText';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.82;

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.4 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // --- RESPONSIVE HEADER ---
    headerContainer: {
        width: '100%',
        paddingHorizontal: width * 0.05, 
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
        paddingBottom: 15,
        zIndex: 10,
    },
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%',
    }, 
    headerLeft: { 
        flexDirection: 'row', 
        alignItems: 'center',
        flex: 1, 
        marginRight: 10,
    },
    iconCircle: { 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    headerTextContainer: { 
        marginLeft: 12,
        flex: 1,
    },
    headerTitle: { 
        color: '#FFF', 
        fontSize: 18, 
        fontWeight: '800' 
    },
    headerSubtitle: { 
        color: 'rgba(255,255,255,0.7)', 
        fontSize: 10, 
        fontWeight: '900', 
        letterSpacing: 1.5 
    },

    // --- Content Styling ---
    boardContent: { paddingHorizontal: 12, paddingVertical: 10 },
    column: { width: COLUMN_WIDTH, backgroundColor: '#FFF', borderRadius: 24, marginHorizontal: 8, padding: 20, height: height * 0.72, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    infoColumn: { backgroundColor: '#FFF' },
    columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    row: { flexDirection: 'row', alignItems: 'center' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoIconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F0F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    columnTitle: { fontWeight: '800', fontSize: 18, color: '#1E293B' },
    editPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    editBtnText: { color: '#00686F', fontWeight: '800', fontSize: 12, marginLeft: 4 },
    detailCard: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    infoLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1, marginBottom: 6 },
    mainInfoValue: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    infoValue: { fontSize: 14, color: '#475569', fontWeight: '500', lineHeight: 20 },
    emptyDescText: { color: '#94A3B8', fontStyle: 'italic' },

    trelloColumn: { width: COLUMN_WIDTH, backgroundColor: '#EDF2F7', borderRadius: 24, marginHorizontal: 8, maxHeight: height * 0.72, padding: 16 },
    trelloHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
    trelloTitle: { fontWeight: '800', fontSize: 16, color: '#2D3748' },
    
    trelloTaskCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#FFF', 
        padding: 14, 
        borderRadius: 14,
        marginBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#E2E8F0'
    },
    checkArea: { marginRight: 12 },
    textArea: { flex: 1 },
    trelloTaskText: { fontSize: 15, color: '#334155', fontWeight: '500' },
    taskCompletedText: { textDecorationLine: 'line-through', color: '#CBD5E1' },
    grabHandle: { marginLeft: 8 },
    deleteSwipeAction: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 25, height: '88%', borderRadius: 14, marginBottom: 10 },

    trelloAddTaskBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
    trelloAddTaskText: { fontSize: 14, color: '#64748B', marginLeft: 8, fontWeight: '700' },
    addListBtn: { width: COLUMN_WIDTH * 0.7, height: 56, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
    addListBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15, marginLeft: 8 },
    
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFF', width: '88%', padding: 24, borderRadius: 28 },
    modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 18, color: '#1E293B' },
    modalInput: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 16, marginBottom: 24, fontSize: 16, color: '#1E293B' },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
    modalCancel: { padding: 12, marginRight: 12 },
    modalSave: { backgroundColor: '#00686F', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14 },
});

export default function EventDetailsScreen({ route, navigation }) {
    const { eventId } = route.params;
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [columns, setColumns] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: '', columnId: '', taskId: '', title: '' });
    const [inputText, setInputText] = useState('');

    useFocusEffect(
        useCallback(() => { fetchEvent(); }, [eventId])
    );

    const fetchEvent = async () => {
        try {
            const docRef = doc(db, 'events', eventId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setEventData(data);
                if (data.columns) setColumns(data.columns);
            }
        } catch (error) { console.error("Fetch Error:", error); } 
        finally { setLoading(false); }
    };

    // --- NEW: COLLABORATOR INVITE LOGIC ---
    const inviteCollaborator = async (emailToInvite) => {
        const email = emailToInvite.trim().toLowerCase();
        if (!email.includes('@')) {
            Alert.alert("Invalid Email", "Please enter a valid email address.");
            return;
        }

        try {
            const docRef = doc(db, 'events', eventId);
            const currentCollaborators = eventData.collaborators || [];

            if (currentCollaborators.includes(email)) {
                Alert.alert("Already Added", "This user is already a collaborator.");
                return;
            }

            await updateDoc(docRef, {
                collaborators: [...currentCollaborators, email]
            });

            Alert.alert("Success", `${email} has been added to the workspace.`);
            fetchEvent(); // Refresh data to show updated collaborator count
        } catch (error) {
            Alert.alert("Error", "Could not add collaborator.");
        }
    };

    const onShare = async () => {
        if (!eventData) return;
        try {
            await Share.share({
                title: eventData.title,
                message: `📅 Event: ${eventData.title}\n📍 Location: ${eventData.location || 'TBD'}\n⏰ Date: ${eventData.startDate}`,
            });
        } catch (error) { Alert.alert("Error", error.message); }
    };

    const syncToFirebase = async (updatedColumns) => {
        try {
            const docRef = doc(db, 'events', eventId);
            await updateDoc(docRef, { columns: updatedColumns });
        } catch (error) { console.error("Sync Error:", error); }
    };

    const handleModalSubmit = async () => {
        if (!inputText.trim()) return;

        // Check if we are inviting a user
        if (modalConfig.type === 'INVITE_USER') {
            await inviteCollaborator(inputText);
            setModalVisible(false);
            setInputText('');
            return;
        }

        let newColumns = [...columns];
        if (modalConfig.type === 'ADD_COLUMN') {
            newColumns = [...columns, { id: Date.now().toString(), title: inputText, tasks: [] }];
        } else if (modalConfig.type === 'EDIT_COLUMN') {
            newColumns = columns.map(col => col.id === modalConfig.columnId ? { ...col, title: inputText } : col);
        } else if (modalConfig.type === 'ADD_TASK') {
            newColumns = columns.map(col => col.id === modalConfig.columnId ? { ...col, tasks: [...col.tasks, { id: Date.now().toString(), text: inputText, completed: false }] } : col);
        } else if (modalConfig.type === 'EDIT_TASK') {
            newColumns = columns.map(col => col.id === modalConfig.columnId ? { ...col, tasks: col.tasks.map(t => t.id === modalConfig.taskId ? { ...t, text: inputText } : t) } : col);
        }
        setColumns(newColumns);
        await syncToFirebase(newColumns);
        setModalVisible(false);
        setInputText('');
    };

    const toggleTask = async (columnId, taskId) => {
        const newColumns = columns.map(col => col.id === columnId ? { ...col, tasks: col.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) } : col);
        setColumns(newColumns);
        await syncToFirebase(newColumns);
    };

    const deleteTask = async (columnId, taskId) => {
        const newColumns = columns.map(col => col.id === columnId ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) } : col);
        setColumns(newColumns);
        await syncToFirebase(newColumns);
    };

    const deleteColumn = (columnId) => {
        Alert.alert("Delete List", "Remove this entire list?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                const newColumns = columns.filter(col => col.id !== columnId);
                setColumns(newColumns);
                await syncToFirebase(newColumns);
            }}
        ]);
    };

    const renderRightActions = (progress, dragX, columnId, taskId) => {
        const trans = dragX.interpolate({ inputRange: [-80, 0], outputRange: [0, 80], extrapolate: 'clamp' });
        return (
            <TouchableOpacity style={styles.deleteSwipeAction} onPress={() => deleteTask(columnId, taskId)}>
                <Animated.View style={{ transform: [{ translateX: trans }] }}>
                    <Ionicons name="trash-outline" size={24} color="#FFF" />
                </Animated.View>
            </TouchableOpacity>
        );
    };

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#00686F" /></View>;

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#004D52', '#00686F']} style={styles.gradientBg} />
            
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                                <Ionicons name="chevron-back" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.headerTextContainer}>
                                <CustomText style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                                    {eventData?.title}
                                </CustomText>
                                <CustomText style={styles.headerSubtitle}>EVENT WORKSPACE</CustomText>
                            </View>
                        </View>
                        
                        {/* CHANGED: Share Button now triggers Invite Modal */}
                        <TouchableOpacity 
                            onPress={() => {
                                setModalConfig({ type: 'INVITE_USER', title: 'Invite Collaborator' });
                                setInputText('');
                                setModalVisible(true);
                            }} 
                            style={styles.iconCircle}
                        >
                            <Ionicons name="person-add-outline" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={COLUMN_WIDTH + 16} decelerationRate="fast" contentContainerStyle={styles.boardContent}>
                    {/* 1. OVERVIEW */}
                    <View style={[styles.column, styles.infoColumn]}>
                        <View style={styles.columnHeader}>
                            <View style={styles.row}>
                                <View style={styles.infoIconBg}><Ionicons name="stats-chart" size={18} color="#00686F" /></View>
                                <CustomText style={styles.columnTitle}>Overview</CustomText>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('UpdateEvent', { eventId, eventData })} style={styles.editPill}>
                                <Ionicons name="pencil" size={12} color="#00686F" /><CustomText style={styles.editBtnText}>Edit</CustomText>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.detailCard}><CustomText style={styles.infoLabel}>EVENT NAME</CustomText><CustomText style={styles.mainInfoValue}>{eventData?.title}</CustomText></View>
                            <View style={styles.detailCard}><CustomText style={styles.infoLabel}>TYPE</CustomText><CustomText style={styles.infoValue}>{eventData?.eventType || "Not set"}</CustomText></View>
                            <View style={styles.detailCard}><CustomText style={styles.infoLabel}>DESCRIPTION</CustomText><CustomText style={[styles.infoValue, !eventData?.description && styles.emptyDescText]}>{eventData?.description || "No description provided"}</CustomText></View>
                            <View style={styles.rowBetween}>
                                <View style={[styles.detailCard, { width: '48%' }]}><CustomText style={styles.infoLabel}>START DATE</CustomText><CustomText style={styles.infoValue}>{eventData?.startDate || '---'}</CustomText></View>
                                <View style={[styles.detailCard, { width: '48%' }]}><CustomText style={styles.infoLabel}>END DATE</CustomText><CustomText style={styles.infoValue}>{eventData?.isMultiDay ? eventData?.endDate : 'Single Day'}</CustomText></View>
                            </View>
                            <View style={styles.detailCard}><CustomText style={styles.infoLabel}>LOCATION</CustomText><View style={styles.row}><Ionicons name="location-sharp" size={14} color="#00686F" style={{ marginRight: 6 }} /><CustomText style={styles.infoValue}>{eventData?.location || "TBD"}</CustomText></View></View>
                        </ScrollView>
                    </View>

                    {/* 2. DYNAMIC LISTS */}
                    {columns.map((col) => (
                        <View key={col.id} style={styles.trelloColumn}>
                            <View style={styles.trelloHeader}>
                                <TouchableOpacity style={{flex: 1}} onPress={() => { setModalConfig({ type: 'EDIT_COLUMN', columnId: col.id, title: 'Rename List' }); setInputText(col.title); setModalVisible(true); }}>
                                    <CustomText style={styles.trelloTitle}>{col.title.toUpperCase()}</CustomText>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => deleteColumn(col.id)}>
                                    <Ionicons name="trash-outline" size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {col.tasks.map((task) => (
                                    <Swipeable key={task.id} renderRightActions={(p, d) => renderRightActions(p, d, col.id, task.id)} friction={2}>
                                        <View style={styles.trelloTaskCard}>
                                            <TouchableOpacity style={styles.checkArea} onPress={() => toggleTask(col.id, task.id)}>
                                                <Ionicons name={task.completed ? "checkmark-circle" : "ellipse-outline"} size={24} color={task.completed ? "#10B981" : "#CBD5E1"} />
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.textArea} onPress={() => { setModalConfig({ type: 'EDIT_TASK', columnId: col.id, taskId: task.id, title: 'Edit Card' }); setInputText(task.text); setModalVisible(true); }}>
                                                <CustomText style={[styles.trelloTaskText, task.completed && styles.taskCompletedText]}>{task.text}</CustomText>
                                            </TouchableOpacity>
                                            <View style={styles.grabHandle}>
                                                <Ionicons name="reorder-two" size={20} color="#E2E8F0" />
                                            </View>
                                        </View>
                                    </Swipeable>
                                ))}
                                <TouchableOpacity style={styles.trelloAddTaskBtn} onPress={() => { setModalConfig({ type: 'ADD_TASK', columnId: col.id, title: 'Add a card' }); setInputText(''); setModalVisible(true); }}>
                                    <Ionicons name="add" size={20} color="#64748B" />
                                    <CustomText style={styles.trelloAddTaskText}>Add a card</CustomText>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addListBtn} onPress={() => { setModalConfig({ type: 'ADD_COLUMN', title: 'Add a list' }); setInputText(''); setModalVisible(true); }}>
                        <Ionicons name="add-circle" size={24} color="#FFF" />
                        <CustomText style={styles.addListBtnText}>Add list</CustomText>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>

            <Modal transparent visible={modalVisible} animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <CustomText style={styles.modalTitle}>{modalConfig.title}</CustomText>
                        <TextInput 
                            style={styles.modalInput} 
                            autoFocus 
                            value={inputText} 
                            onChangeText={setInputText} 
                            placeholder={modalConfig.type === 'INVITE_USER' ? "Enter registered email" : "Type something..."} 
                            placeholderTextColor="#94A3B8" 
                            autoCapitalize={modalConfig.type === 'INVITE_USER' ? 'none' : 'sentences'}
                            keyboardType={modalConfig.type === 'INVITE_USER' ? 'email-address' : 'default'}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}><CustomText style={{color: '#64748B', fontWeight: '700'}}>Cancel</CustomText></TouchableOpacity>
                            <TouchableOpacity onPress={handleModalSubmit} style={styles.modalSave}><CustomText style={{color: '#FFF', fontWeight: 'bold'}}>Save Changes</CustomText></TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}