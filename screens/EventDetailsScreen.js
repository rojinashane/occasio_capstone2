import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Dimensions,
    ActivityIndicator,
    StatusBar,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import CustomText from '../components/CustomText';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.85; 

export default function EventDetailsScreen({ route, navigation }) {
    const { eventId } = route.params;
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Board State
    const [columns, setColumns] = useState([]);
    
    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: '', columnId: '', taskId: '', title: '' });
    const [inputText, setInputText] = useState('');

    useFocusEffect(
        useCallback(() => {
            fetchEvent();
        }, [eventId])
    );

    const fetchEvent = async () => {
        try {
            const docRef = doc(db, 'events', eventId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setEventData(docSnap.data());
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- COLUMN ACTIONS ---
    const openAddColumnModal = () => {
        setModalConfig({ type: 'ADD_COLUMN', title: 'New List' });
        setInputText('');
        setModalVisible(true);
    };

    const openEditColumnModal = (column) => {
        setModalConfig({ type: 'EDIT_COLUMN', columnId: column.id, title: 'Rename List' });
        setInputText(column.title);
        setModalVisible(true);
    };

    const deleteColumn = (columnId) => {
        Alert.alert("Delete List", "Are you sure? This will remove all tasks in this list.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => setColumns(columns.filter(col => col.id !== columnId)) }
        ]);
    };

    // --- TASK ACTIONS ---
    const openAddTaskModal = (columnId) => {
        setModalConfig({ type: 'ADD_TASK', columnId, title: 'New Task' });
        setInputText('');
        setModalVisible(true);
    };

    const openEditTaskModal = (columnId, task) => {
        setModalConfig({ type: 'EDIT_TASK', columnId, taskId: task.id, title: 'Edit Task' });
        setInputText(task.text);
        setModalVisible(true);
    };

    const deleteTask = (columnId, taskId) => {
        setColumns(columns.map(col => {
            if (col.id === columnId) {
                return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
            }
            return col;
        }));
    };

    // --- SAVE LOGIC ---
    const handleModalSubmit = () => {
        if (!inputText.trim()) return;

        if (modalConfig.type === 'ADD_COLUMN') {
            setColumns([...columns, { id: Date.now().toString(), title: inputText, tasks: [] }]);
        } 
        else if (modalConfig.type === 'EDIT_COLUMN') {
            setColumns(columns.map(col => col.id === modalConfig.columnId ? { ...col, title: inputText } : col));
        }
        else if (modalConfig.type === 'ADD_TASK') {
            setColumns(columns.map(col => {
                if (col.id === modalConfig.columnId) {
                    return { ...col, tasks: [...col.tasks, { id: Date.now().toString(), text: inputText }] };
                }
                return col;
            }));
        }
        else if (modalConfig.type === 'EDIT_TASK') {
            setColumns(columns.map(col => {
                if (col.id === modalConfig.columnId) {
                    return { ...col, tasks: col.tasks.map(t => t.id === modalConfig.taskId ? { ...t, text: inputText } : t) };
                }
                return col;
            }));
        }
        setModalVisible(false);
    };

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#00686F" /></View>;

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#004D52', '#00686F']} style={styles.gradientBg} />
            
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <CustomText style={styles.headerTitle}>{eventData?.title}</CustomText>
                        <CustomText style={styles.headerSubtitle}>Event ID: {eventId.substring(0,8)}</CustomText>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={COLUMN_WIDTH + 16} decelerationRate="fast" contentContainerStyle={styles.boardContent}>
                    
                    {/* INFO CARD */}
                    <View style={[styles.column, styles.infoColumn]}>
                        <View style={styles.columnHeader}>
                            <View style={styles.row}>
                                <View style={styles.infoIconBg}><Ionicons name="document-text" size={18} color="#00686F" /></View>
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
                            <View style={styles.detailCard}><CustomText style={styles.infoLabel}>LOCATION</CustomText><View style={styles.row}><Ionicons name="map-outline" size={14} color="#00686F" style={{ marginRight: 6 }} /><CustomText style={styles.infoValue}>{eventData?.location || "TBD"}</CustomText></View></View>
                        </ScrollView>
                    </View>

                    {/* DYNAMIC TRELLO COLUMNS */}
                    {columns.map((col) => (
                        <View key={col.id} style={styles.column}>
                            <View style={styles.columnHeader}>
                                <CustomText style={[styles.columnTitle, {flex: 1}]} numberOfLines={1}>{col.title}</CustomText>
                                <View style={styles.row}>
                                    <TouchableOpacity onPress={() => openAddTaskModal(col.id)} style={{marginRight: 10}}><Ionicons name="add-circle" size={24} color="#00686F" /></TouchableOpacity>
                                    <TouchableOpacity onPress={() => Alert.alert(col.title, "Manage List", [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Rename List", onPress: () => openEditColumnModal(col) },
                                        { text: "Delete List", style: "destructive", onPress: () => deleteColumn(col.id) }
                                    ])}><Ionicons name="ellipsis-vertical" size={20} color="#94A3B8" /></TouchableOpacity>
                                </View>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {col.tasks.length === 0 ? (
                                    <View style={styles.emptyCardPlaceholder}><CustomText style={styles.emptyText}>Empty List</CustomText></View>
                                ) : (
                                    col.tasks.map((task) => (
                                        <TouchableOpacity 
                                            key={task.id} 
                                            style={styles.taskCard} 
                                            onLongPress={() => Alert.alert("Manage Task", "What would you like to do?", [
                                                { text: "Cancel", style: "cancel" },
                                                { text: "Edit Task", onPress: () => openEditTaskModal(col.id, task) },
                                                { text: "Delete Task", style: "destructive", onPress: () => deleteTask(col.id, task.id) }
                                            ])}
                                        >
                                            <CustomText style={styles.taskText}>{task.text}</CustomText>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addListColumn} onPress={openAddColumnModal}>
                        <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} style={styles.addListGradient}>
                            <Ionicons name="add" size={32} color="#FFF" /><CustomText style={styles.addListText}>Add List</CustomText>
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>

            {/* MODAL */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <CustomText style={styles.modalTitle}>{modalConfig.title}</CustomText>
                        <TextInput style={styles.modalInput} autoFocus placeholder="Enter text..." value={inputText} onChangeText={setInputText} />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}><CustomText style={{color: '#64748B'}}>Cancel</CustomText></TouchableOpacity>
                            <TouchableOpacity onPress={handleModalSubmit} style={styles.modalSave}><CustomText style={{color: '#FFF', fontWeight: 'bold'}}>Save</CustomText></TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F1F5F9' },
    gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.3 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTextContainer: { marginLeft: 15 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
    headerSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 'bold' },
    boardContent: { paddingHorizontal: 16, paddingVertical: 10 },
    column: { width: COLUMN_WIDTH, backgroundColor: 'rgba(241, 245, 249, 0.95)', borderRadius: 28, marginHorizontal: 8, padding: 20, height: height * 0.72, elevation: 5 },
    infoColumn: { backgroundColor: '#FFF' },
    columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    row: { flexDirection: 'row', alignItems: 'center' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    infoIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    columnTitle: { fontWeight: '800', fontSize: 18, color: '#1E293B' },
    editPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    editBtnText: { color: '#00686F', fontWeight: '800', fontSize: 12, marginLeft: 4 },
    detailCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    taskCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 14, marginBottom: 10, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#00686F' },
    taskText: { fontSize: 14, color: '#334155', fontWeight: '600' },
    addListColumn: { width: COLUMN_WIDTH, marginHorizontal: 8, height: 80, marginTop: 10 },
    addListGradient: { flex: 1, borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },
    addListText: { color: '#FFF', fontWeight: '700', marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFF', width: '80%', padding: 20, borderRadius: 20 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15, textAlign: 'center' },
    modalInput: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, marginBottom: 20 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }, // FIXED LINE
    modalCancel: { padding: 10, marginRight: 10 },
    modalSave: { backgroundColor: '#00686F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    infoLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1.2, marginBottom: 8 },
    mainInfoValue: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    infoValue: { fontSize: 14, color: '#475569', fontWeight: '500' },
    emptyDescText: { color: '#94A3B8', fontStyle: 'italic' },
    emptyCardPlaceholder: { height: 100, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 20 },
    emptyText: { color: '#94A3B8', fontWeight: '600' }
}); 