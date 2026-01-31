import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
    ActivityIndicator, StatusBar, TextInput, Modal, KeyboardAvoidingView,
    Platform, Animated, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase'; // Ensure auth is exported from your firebase config
import { 
    doc, getDoc, updateDoc, deleteDoc, 
    collection, query, where, getDocs, addDoc, serverTimestamp 
} from 'firebase/firestore'; 
import CustomText from '../components/CustomText';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.82;

const formatDate = (dateVal) => {
    if (!dateVal) return 'TBD';
    let d = dateVal.seconds ? new Date(dateVal.seconds * 1000) : new Date(dateVal);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function EventDetailsScreen({ route, navigation }) {
    const { eventId } = route.params;
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [columns, setColumns] = useState([]);
    
    // UI State Modals
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [collabModalVisible, setCollabModalVisible] = useState(false);
    
    const [modalConfig, setModalConfig] = useState({ type: '', columnId: '', taskId: '', title: '' });
    const [listToDelete, setListToDelete] = useState(null);
    const [inputText, setInputText] = useState('');
    const [subtaskText, setSubtaskText] = useState('');
    const [collabEmail, setCollabEmail] = useState('');

    // Active Card State
    const [activeTask, setActiveTask] = useState(null);
    const [activeColumnId, setActiveColumnId] = useState(null);

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

    const syncToFirebase = async (updatedColumns) => {
        try {
            const docRef = doc(db, 'events', eventId);
            await updateDoc(docRef, { columns: updatedColumns });
        } catch (error) { console.error("Sync Error:", error); }
    };

    // --- WORKSPACE ACTIONS ---
    const handleDeleteWorkspace = () => {
        setMenuVisible(false);
        Alert.alert(
            "Delete Workspace",
            "This will permanently delete the event and all tasks for everyone. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete Forever", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'events', eventId));
                            navigation.navigate('Dashboard');
                        } catch (error) { Alert.alert("Error", "Could not delete workspace."); }
                    } 
                }
            ]
        );
    };

    const handleAddCollaborator = async () => {
        if (!collabEmail.trim()) return;
        if (collabEmail.trim().toLowerCase() === auth.currentUser?.email?.toLowerCase()) {
            Alert.alert("Wait", "You are already the owner of this workspace!");
            return;
        }

        setActionLoading(true);
        try {
            // 1. Check if user is registered
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("email", "==", collabEmail.trim().toLowerCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                Alert.alert("User Not Found", "This email is not registered in our system.");
                setActionLoading(false);
                return;
            }

            const recipientId = querySnapshot.docs[0].id;

            // 2. Send Invitation Request
            await addDoc(collection(db, 'notifications'), {
                type: 'COLLAB_REQUEST',
                senderName: auth.currentUser?.displayName || "A user",
                senderEmail: auth.currentUser?.email,
                eventId: eventId,
                eventTitle: eventData?.title,
                recipientId: recipientId,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            setCollabModalVisible(false);
            setCollabEmail('');
            Alert.alert("Invitation Sent", `We've sent a request to ${collabEmail}. they will appear here once they accept.`);
        } catch (error) {
            console.error("Collab Error:", error);
            Alert.alert("Error", "Failed to send invitation.");
        } finally {
            setActionLoading(false);
        }
    };

    // --- LIST & CARD LOGIC (EXISTING) ---
    const updateColumnTitle = async (columnId, newTitle) => {
        const updated = columns.map(col => col.id === columnId ? { ...col, title: newTitle } : col);
        setColumns(updated);
        await syncToFirebase(updated);
    };

    const triggerDeleteList = (columnId) => {
        setListToDelete(columnId);
        setDeleteConfirmVisible(true);
    };

    const confirmDeleteList = async () => {
        const updated = columns.filter(col => col.id !== listToDelete);
        setColumns(updated);
        await syncToFirebase(updated);
        setDeleteConfirmVisible(false);
    };

    const toggleCardCompletion = async (columnId, taskId) => {
        const updatedColumns = columns.map(col => {
            if (col.id === columnId) {
                return { ...col, tasks: col.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t) };
            }
            return col;
        });
        setColumns(updatedColumns);
        await syncToFirebase(updatedColumns);
    };

    const openTaskDetails = (columnId, task) => {
        setActiveColumnId(columnId);
        setActiveTask({ ...task, description: task.description || '', priority: task.priority || 'C', subtasks: task.subtasks || [] });
        setDetailModalVisible(true);
    };

    const saveTaskDetails = async () => {
        const updatedColumns = columns.map(col => {
            if (col.id === activeColumnId) {
                return { ...col, tasks: col.tasks.map(t => t.id === activeTask.id ? activeTask : t) };
            }
            return col;
        });
        setColumns(updatedColumns);
        await syncToFirebase(updatedColumns);
        setDetailModalVisible(false);
    };

    const addChecklistItem = () => {
        if (!subtaskText.trim()) return;
        setActiveTask({ ...activeTask, subtasks: [...(activeTask.subtasks || []), { id: Date.now().toString(), text: subtaskText, completed: false }] });
        setSubtaskText('');
    };

    const toggleChecklistItem = (id) => {
        const updated = activeTask.subtasks.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
        setActiveTask({ ...activeTask, subtasks: updated });
    };

    const handleModalSubmit = async () => {
        if (!inputText.trim()) return;
        let newColumns = [...columns];
        if (modalConfig.type === 'ADD_COLUMN') {
            newColumns.push({ id: Date.now().toString(), title: inputText, tasks: [] });
        } else if (modalConfig.type === 'ADD_TASK') {
            newColumns = columns.map(col => col.id === modalConfig.columnId ? { 
                ...col, tasks: [...col.tasks, { id: Date.now().toString(), text: inputText, completed: false, priority: 'C', description: '', subtasks: [] }] 
            } : col);
        }
        setColumns(newColumns);
        await syncToFirebase(newColumns);
        setModalVisible(false);
        setInputText('');
    };

    const getPriorityColor = (p) => p === 'A' ? '#EF4444' : p === 'B' ? '#F59E0B' : '#10B981';

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#00686F" /></View>;

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#004D52', '#00686F']} style={styles.gradientBg} />
            
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <View style={styles.headerContainer}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <CustomText style={styles.headerTitle} numberOfLines={1}>{eventData?.title}</CustomText>
                            <CustomText style={styles.headerSubtitle}>EVENT WORKSPACE</CustomText>
                        </View>
                        <TouchableOpacity style={styles.iconCircle} onPress={() => setMenuVisible(true)}>
                            <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={COLUMN_WIDTH + 16} decelerationRate="fast" contentContainerStyle={styles.boardContent}>
                    {/* OVERVIEW */}
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
                            <View style={styles.detailCard}><CustomText style={styles.infoLabel}>TYPE</CustomText><CustomText style={styles.infoValue}>{eventData?.eventType || "Not set"}</CustomText></View>
                            <View style={styles.detailCard}><CustomText style={styles.infoLabel}>LOCATION</CustomText><CustomText style={styles.infoValue}>{eventData?.location || "TBD"}</CustomText></View>
                            <View style={styles.detailCard}><CustomText style={styles.infoLabel}>START DATE</CustomText><CustomText style={styles.infoValue}>{formatDate(eventData?.startDate)}</CustomText></View>
                            <View style={styles.detailCard}><CustomText style={styles.infoLabel}>DESCRIPTION</CustomText><CustomText style={styles.infoValue}>{eventData?.description || "No description provided"}</CustomText></View>
                        </ScrollView>
                    </View>

                    {/* DYNAMIC LISTS */}
                    {columns.map((col) => (
                        <View key={col.id} style={styles.trelloColumn}>
                            <View style={styles.trelloHeaderRow}>
                                <TextInput style={styles.trelloTitleInput} value={col.title} onChangeText={(text) => updateColumnTitle(col.id, text)} />
                                <TouchableOpacity onPress={() => triggerDeleteList(col.id)}><Ionicons name="trash-outline" size={20} color="#EF4444" /></TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {col.tasks.map((task) => (
                                    <Swipeable key={task.id} renderRightActions={(p, d) => (
                                        <TouchableOpacity style={styles.deleteSwipeAction} onPress={() => {
                                            const updated = columns.map(c => c.id === col.id ? {...c, tasks: c.tasks.filter(t => t.id !== task.id)} : c);
                                            setColumns(updated); syncToFirebase(updated);
                                        }}>
                                            <Ionicons name="trash-outline" size={24} color="#FFF" />
                                        </TouchableOpacity>
                                    )}>
                                        <TouchableOpacity style={[styles.trelloTaskCard, { borderLeftWidth: 6, borderLeftColor: getPriorityColor(task.priority) }]} onPress={() => openTaskDetails(col.id, task)}>
                                            <View style={styles.cardHeaderRow}>
                                                <TouchableOpacity onPress={() => toggleCardCompletion(col.id, task.id)} style={styles.outerCheckbox}>
                                                    <Ionicons name={task.completed ? "checkbox" : "square-outline"} size={20} color={task.completed ? "#10B981" : "#CBD5E1"} />
                                                </TouchableOpacity>
                                                <CustomText style={[styles.trelloTaskText, task.completed && styles.checkTextDone]}>{task.text}</CustomText>
                                            </View>
                                        </TouchableOpacity>
                                    </Swipeable>
                                ))}
                                <TouchableOpacity style={styles.trelloAddTaskBtn} onPress={() => { setModalConfig({ type: 'ADD_TASK', columnId: col.id, title: 'Add a card' }); setInputText(''); setModalVisible(true); }}>
                                    <Ionicons name="add" size={20} color="#64748B" /><CustomText style={styles.trelloAddTaskText}>Add a card</CustomText>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addListBtn} onPress={() => { setModalConfig({ type: 'ADD_COLUMN', title: 'Add a list' }); setInputText(''); setModalVisible(true); }}>
                        <Ionicons name="add-circle" size={24} color="#FFF" /><CustomText style={styles.addListBtnText}>Add list</CustomText>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>

            {/* OPTIONS MENU (3-Dots) */}
            <Modal transparent visible={menuVisible} animationType="slide">
                <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuContent}>
                        <View style={styles.menuHandle} />
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setCollabModalVisible(true); }}>
                            <Ionicons name="person-add-outline" size={22} color="#1E293B" />
                            <CustomText style={styles.menuItemText}>Add a Collaborator</CustomText>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleDeleteWorkspace}>
                            <Ionicons name="trash-outline" size={22} color="#EF4444" />
                            <CustomText style={[styles.menuItemText, { color: '#EF4444' }]}>Delete Event Workspace</CustomText>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* COLLABORATOR INVITE MODAL */}
            <Modal transparent visible={collabModalVisible} animationType="fade">
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <CustomText style={styles.modalTitle}>Invite Collaborator</CustomText>
                        <CustomText style={styles.modalSubLabel}>Enter the email of a registered user to send a request.</CustomText>
                        <TextInput 
                            style={styles.modalInput} 
                            autoFocus 
                            placeholder="email@example.com" 
                            value={collabEmail} 
                            onChangeText={setCollabEmail} 
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setCollabModalVisible(false)} style={styles.modalCancel}><CustomText style={{color: '#64748B'}}>Cancel</CustomText></TouchableOpacity>
                            <TouchableOpacity onPress={handleAddCollaborator} style={styles.modalSave} disabled={actionLoading}>
                                {actionLoading ? <ActivityIndicator color="#FFF" /> : <CustomText style={{color: '#FFF', fontWeight: 'bold'}}>Send Request</CustomText>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Standard List/Card Add Modal */}
            <Modal transparent visible={modalVisible} animationType="fade">
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <CustomText style={styles.modalTitle}>{modalConfig.title}</CustomText>
                        <TextInput style={styles.modalInput} autoFocus value={inputText} onChangeText={setInputText} placeholder="Name..." />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}><CustomText style={{color: '#64748B'}}>Cancel</CustomText></TouchableOpacity>
                            <TouchableOpacity onPress={handleModalSubmit} style={styles.modalSave}><CustomText style={{color: '#FFF', fontWeight: 'bold'}}>Confirm</CustomText></TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* DELETE LIST CONFIRMATION */}
            <Modal transparent visible={deleteConfirmVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.deleteModalBox}>
                        <CustomText style={styles.deleteModalTitle}>Delete List?</CustomText>
                        <CustomText style={styles.deleteModalSub}>This action cannot be undone.</CustomText>
                        <View style={styles.deleteModalActions}>
                            <TouchableOpacity onPress={() => setDeleteConfirmVisible(false)} style={styles.deleteCancelBtn}><CustomText style={styles.deleteCancelText}>No</CustomText></TouchableOpacity>
                            <TouchableOpacity onPress={confirmDeleteList} style={styles.deleteConfirmBtn}><CustomText style={styles.deleteConfirmText}>Delete</CustomText></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* TASK DETAILS MODAL */}
            <Modal visible={detailModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.detailModalContainer}>
                    <View style={styles.detailHeader}>
                        <TouchableOpacity onPress={() => setDetailModalVisible(false)}><CustomText style={{color: '#64748B'}}>Close</CustomText></TouchableOpacity>
                        <CustomText style={styles.detailHeaderTitle}>Edit Card</CustomText>
                        <TouchableOpacity onPress={saveTaskDetails}><CustomText style={{color: '#00686F', fontWeight: 'bold'}}>Save</CustomText></TouchableOpacity>
                    </View>
                    <ScrollView style={{ padding: 20 }}>
                        <CustomText style={styles.detailLabel}>CARD TITLE</CustomText>
                        <TextInput style={styles.detailTitleInput} value={activeTask?.text} onChangeText={(t) => setActiveTask({...activeTask, text: t})} />
                        
                        <CustomText style={styles.detailLabel}>PRIORITY</CustomText>
                        <View style={styles.priorityRow}>
                            {['A', 'B', 'C'].map((p) => (
                                <TouchableOpacity key={p} onPress={() => setActiveTask({...activeTask, priority: p})} style={[styles.priorityBtn, { backgroundColor: activeTask?.priority === p ? getPriorityColor(p) : '#F1F5F9' }]}>
                                    <CustomText style={{ color: activeTask?.priority === p ? '#FFF' : '#64748B' }}>{p === 'A' ? 'High' : p === 'B' ? 'Med' : 'Low'}</CustomText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <CustomText style={styles.detailLabel}>DESCRIPTION</CustomText>
                        <TextInput style={styles.detailDescInput} multiline value={activeTask?.description} onChangeText={(t) => setActiveTask({...activeTask, description: t})} />

                        <CustomText style={styles.detailLabel}>CHECKLIST</CustomText>
                        {activeTask?.subtasks?.map((item) => (
                            <View key={item.id} style={styles.checkItemRow}>
                                <TouchableOpacity style={styles.checkItemLeft} onPress={() => toggleChecklistItem(item.id)}>
                                    <Ionicons name={item.completed ? "checkbox" : "square-outline"} size={22} color={item.completed ? "#00686F" : "#CBD5E1"} />
                                    <CustomText style={[styles.checkText, item.completed && styles.checkTextDone]}>{item.text}</CustomText>
                                </TouchableOpacity>
                            </View>
                        ))}
                        <View style={styles.addChecklistRow}>
                            <TextInput style={styles.checklistInput} placeholder="Add item..." value={subtaskText} onChangeText={setSubtaskText} />
                            <TouchableOpacity onPress={addChecklistItem} style={styles.miniAddBtn}><Ionicons name="add" size={24} color="#FFF" /></TouchableOpacity>
                        </View>
                        <View style={{height: 100}} />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.4 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { width: '100%', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTextContainer: { marginLeft: 12, flex: 1 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    headerSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    boardContent: { paddingHorizontal: 12, paddingVertical: 10 },
    column: { width: COLUMN_WIDTH, backgroundColor: '#FFF', borderRadius: 24, marginHorizontal: 8, padding: 20, height: height * 0.72, elevation: 5 },
    infoColumn: { backgroundColor: '#FFF' },
    columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    row: { flexDirection: 'row', alignItems: 'center' },
    infoIconBg: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F0F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    columnTitle: { fontWeight: '800', fontSize: 18, color: '#1E293B' },
    editPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    editBtnText: { color: '#00686F', fontWeight: '800', fontSize: 12, marginLeft: 4 },
    detailCard: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    infoLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 6 },
    infoValue: { fontSize: 14, color: '#475569', fontWeight: '500' },
    trelloColumn: { width: COLUMN_WIDTH, backgroundColor: '#EDF2F7', borderRadius: 24, marginHorizontal: 8, maxHeight: height * 0.72, padding: 16 },
    trelloHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    trelloTitleInput: { flex: 1, fontWeight: '800', fontSize: 16, color: '#2D3748', textTransform: 'uppercase' },
    trelloTaskCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 14, marginBottom: 10, elevation: 2 },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
    outerCheckbox: { marginRight: 10 },
    trelloTaskText: { fontSize: 15, color: '#334155', fontWeight: '600', flex: 1 },
    checkTextDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
    trelloAddTaskBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 12, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
    trelloAddTaskText: { fontSize: 14, color: '#64748B', marginLeft: 8, fontWeight: '700' },
    addListBtn: { width: COLUMN_WIDTH * 0.7, height: 56, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16 },
    addListBtnText: { color: '#FFF', fontWeight: '800', marginLeft: 8 },
    deleteSwipeAction: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 80, height: '85%', borderRadius: 14, marginLeft: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#FFF', width: '88%', padding: 24, borderRadius: 28 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 5 },
    modalSubLabel: { fontSize: 13, color: '#64748B', marginBottom: 15 },
    modalInput: { backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, marginBottom: 20 },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end' },
    modalCancel: { padding: 10, marginRight: 10 },
    modalSave: { backgroundColor: '#00686F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, minWidth: 100, alignItems: 'center' },
    menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    menuContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingBottom: 40, paddingHorizontal: 20 },
    menuHandle: { width: 40, height: 5, backgroundColor: '#E2E8F0', borderRadius: 3, alignSelf: 'center', marginVertical: 15 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    menuItemText: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginLeft: 15 },
    detailModalContainer: { flex: 1, backgroundColor: '#FFF' },
    detailHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    detailHeaderTitle: { fontSize: 16, fontWeight: '800' },
    detailLabel: { fontSize: 11, fontWeight: '900', color: '#94A3B8', marginTop: 25, marginBottom: 10, letterSpacing: 1 },
    detailTitleInput: { fontSize: 18, fontWeight: '700', color: '#1E293B', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
    priorityRow: { flexDirection: 'row', justifyContent: 'space-between' },
    priorityBtn: { flex: 1, marginHorizontal: 4, padding: 12, borderRadius: 10, alignItems: 'center' },
    detailDescInput: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, height: 100, textAlignVertical: 'top' },
    checkItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    checkItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    checkText: { marginLeft: 10, fontSize: 15, color: '#334155' },
    addChecklistRow: { flexDirection: 'row', marginTop: 10 },
    checklistInput: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12 },
    miniAddBtn: { backgroundColor: '#00686F', width: 45, marginLeft: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    deleteModalBox: { backgroundColor: '#FFF', width: '80%', padding: 25, borderRadius: 25, alignItems: 'center' },
    deleteModalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
    deleteModalSub: { color: '#64748B', marginBottom: 20 },
    deleteModalActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
    deleteCancelBtn: { padding: 12 },
    deleteConfirmBtn: { backgroundColor: '#EF4444', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
    deleteConfirmText: { color: '#FFF', fontWeight: 'bold' },
});