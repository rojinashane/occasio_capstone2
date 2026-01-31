import React, { useState } from 'react';
import { 
    View, StyleSheet, ScrollView, TouchableOpacity, 
    TextInput, Switch, ActivityIndicator, Platform, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import CustomText from '../components/CustomText';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function UpdateEvent({ route, navigation }) {
    const { eventId, eventData } = route.params;

    // --- STATE ---
    const [title, setTitle] = useState(eventData?.title || '');
    const [description, setDescription] = useState(eventData?.description || '');
    const [location, setLocation] = useState(eventData?.location || '');
    const [eventType, setEventType] = useState(eventData?.eventType || '');
    const [isMultiDay, setIsMultiDay] = useState(eventData?.isMultiDay || false);
    
    const [startDate, setStartDate] = useState(
        eventData?.startDate?.seconds ? new Date(eventData.startDate.seconds * 1000) : new Date()
    );
    const [endDate, setEndDate] = useState(
        eventData?.endDate?.seconds ? new Date(eventData.endDate.seconds * 1000) : new Date()
    );

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false); // Success Modal State

    const onDateChange = (event, selectedDate, isStart) => {
        if (Platform.OS === 'android') {
            setShowStartPicker(false);
            setShowEndPicker(false);
        }
        if (selectedDate) {
            if (isStart) setStartDate(selectedDate);
            else setEndDate(selectedDate);
        }
    };

    const handleUpdate = async () => {
        if (!title.trim()) return;

        setSaving(true);
        try {
            const docRef = doc(db, 'events', eventId);
            const updatedFields = {
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                eventType: eventType.trim(),
                isMultiDay: isMultiDay,
                startDate: Timestamp.fromDate(startDate),
                endDate: isMultiDay ? Timestamp.fromDate(endDate) : null,
                updatedAt: Timestamp.now(),
            };

            await updateDoc(docRef, updatedFields);
            setShowSuccess(true); // Trigger custom popup
        } catch (error) {
            console.error("Firebase Update Error:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* --- CUSTOM SUCCESS POPUP --- */}
            <Modal transparent visible={showSuccess} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.successBox}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name="checkmark-circle" size={50} color="#00686F" />
                        </View>
                        <CustomText style={styles.successTitle}>Updated!</CustomText>
                        <CustomText style={styles.successSub}>Your event changes have been synced successfully.</CustomText>
                        <TouchableOpacity 
                            style={styles.successBtn} 
                            onPress={() => {
                                setShowSuccess(false);
                                navigation.goBack();
                            }}
                        >
                            <CustomText style={styles.successBtnText}>Continue</CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="close" size={28} color="#1E293B" />
                </TouchableOpacity>
                <CustomText style={styles.headerTitle}>Edit Event</CustomText>
                <TouchableOpacity onPress={handleUpdate} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#00686F" /> : <CustomText style={styles.saveBtn}>Save</CustomText>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
                <CustomText style={styles.label}>EVENT TITLE</CustomText>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter event name" />

                <CustomText style={styles.label}>EVENT TYPE</CustomText>
                <TextInput style={styles.input} value={eventType} onChangeText={setEventType} placeholder="e.g. Wedding, Business" />

                <CustomText style={styles.label}>LOCATION</CustomText>
                <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color="#64748B" style={{marginRight: 8}} />
                    <TextInput 
                        style={[styles.input, { flex: 1, borderBottomWidth: 0, marginBottom: 0 }]} 
                        value={location} onChangeText={setLocation} placeholder="Location" 
                    />
                </View>

                <View style={styles.switchRow}>
                    <View>
                        <CustomText style={styles.switchLabel}>Multi-day Event</CustomText>
                        <CustomText style={styles.switchSub}>Does this span multiple dates?</CustomText>
                    </View>
                    <Switch value={isMultiDay} onValueChange={setIsMultiDay} trackColor={{ false: "#CBD5E1", true: "#00686F" }} />
                </View>

                <View style={styles.dateRow}>
                    <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowStartPicker(true)}>
                        <CustomText style={styles.label}>START DATE</CustomText>
                        <CustomText style={styles.dateValue}>{startDate.toLocaleDateString()}</CustomText>
                    </TouchableOpacity>

                    {isMultiDay && (
                        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowEndPicker(true)}>
                            <CustomText style={styles.label}>END DATE</CustomText>
                            <CustomText style={styles.dateValue}>{endDate.toLocaleDateString()}</CustomText>
                        </TouchableOpacity>
                    )}
                </View>

                {showStartPicker && (
                    <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => onDateChange(e, d, true)} />
                )}

                {showEndPicker && (
                    <DateTimePicker value={endDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => onDateChange(e, d, false)} />
                )}

                <CustomText style={styles.label}>DESCRIPTION</CustomText>
                <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline placeholder="Description" />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    backBtn: { padding: 4 },
    saveBtn: { color: '#00686F', fontWeight: '800', fontSize: 16 },
    form: { padding: 20 },
    label: { fontSize: 11, fontWeight: '900', color: '#94A3B8', marginBottom: 8, letterSpacing: 1 },
    input: { fontSize: 16, color: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 10, marginBottom: 25 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 25 },
    textArea: { height: 100, textAlignVertical: 'top' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12 },
    switchLabel: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    switchSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    datePickerBtn: { flex: 1 },
    dateValue: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
    
    // --- MODAL STYLES ---
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    successBox: { width: '80%', backgroundColor: '#FFF', borderRadius: 30, padding: 30, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    successIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F0F9FA', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    successTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
    successSub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 25 },
    successBtn: { backgroundColor: '#00686F', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 16, width: '100%', alignItems: 'center' },
    successBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});