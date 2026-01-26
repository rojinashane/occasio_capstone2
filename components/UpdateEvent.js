import React, { useState } from 'react';
import {
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
    Switch,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker'; 
import DateTimePicker from '@react-native-community/datetimepicker';

export default function UpdateEvent({ navigation, route }) {
    const { eventId, eventData } = route.params;

    // Form States
    const [title, setTitle] = useState(eventData?.title || '');
    const [eventType, setEventType] = useState(eventData?.eventType || '');
    const [otherType, setOtherType] = useState('');
    const [location, setLocation] = useState(eventData?.location || '');
    const [description, setDescription] = useState(eventData?.description || '');
    const [isMultiDay, setIsMultiDay] = useState(eventData?.isMultiDay || false);
    
    // Date Management - Initialize with existing data
    const [startDate, setStartDate] = useState(new Date()); 
    const [endDate, setEndDate] = useState(new Date());
    const [startDateText, setStartDateText] = useState(eventData?.startDate || '');
    const [endDateText, setEndDateText] = useState(eventData?.endDate || '');

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const eventTypes = ['Wedding', 'Birthday Party', 'Corporate', 'Charity', 'Others'];

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // Fix: Added missing Date Change Handlers
    const onStartChange = (event, selectedDate) => {
        setShowStartPicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
            setStartDateText(formatDate(selectedDate));
        }
    };

    const onEndChange = (event, selectedDate) => {
        setShowEndPicker(false);
        if (selectedDate) {
            setEndDate(selectedDate);
            setEndDateText(formatDate(selectedDate));
        }
    };

    const handleUpdateEvent = async () => {
        const finalType = eventType === 'Others' ? otherType : eventType;
        if (!title || !finalType || !startDateText) {
            Alert.alert('Missing Info', 'Please fill in required fields');
            return;
        }

        setLoading(true);
        try {
            const eventRef = doc(db, 'events', eventId);
            await updateDoc(eventRef, {
                title,
                eventType: finalType,
                startDate: startDateText,
                endDate: isMultiDay ? endDateText : null,
                isMultiDay,
                location: location || 'To be decided',
                description,
                updatedAt: new Date()
            });
            Alert.alert('Success ✨', 'Changes saved!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert('Error', 'Something went wrong. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundButton}>
                        <Ionicons name="chevron-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <CustomText style={styles.headerTitle}>Edit Event</CustomText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.card}>
                        <CustomText style={styles.cardTitle}>Basic Details</CustomText>
                        <View style={styles.inputWrapper}>
                            <CustomText style={styles.label}>Event Name *</CustomText>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="What's the occasion?"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <CustomText style={styles.label}>Event Type *</CustomText>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={eventType}
                                    onValueChange={(v) => setEventType(v)}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Select type..." value="" color="#9CA3AF" />
                                    {eventTypes.map((type) => <Picker.Item key={type} label={type} value={type} />)}
                                </Picker>
                            </View>
                        </View>

                        {eventType === 'Others' && (
                            <View style={styles.inputWrapper}>
                                <TextInput style={styles.input} value={otherType} onChangeText={setOtherType} placeholder="Please specify..." />
                            </View>
                        )}
                    </View>

                    <View style={styles.card}>
                        <CustomText style={styles.cardTitle}>Date & Schedule</CustomText>
                        <View style={styles.inputWrapper}>
                            <CustomText style={styles.label}>Start Date *</CustomText>
                            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowStartPicker(true)}>
                                <Ionicons name="calendar" size={20} color="#00686F" />
                                <CustomText style={[styles.dateValue, !startDateText && {color: '#9CA3AF'}]}>
                                    {startDateText || "Select date"}
                                </CustomText>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inlineSwitchRow}>
                            <CustomText style={styles.switchLabel}>Is this a multi-day event?</CustomText>
                            <Switch
                                value={isMultiDay}
                                onValueChange={setIsMultiDay}
                                trackColor={{ false: "#E5E7EB", true: "#00686F" }}
                            />
                        </View>

                        {isMultiDay && (
                            <View style={styles.inputWrapper}>
                                <CustomText style={styles.label}>End Date *</CustomText>
                                <TouchableOpacity style={styles.dateSelector} onPress={() => setShowEndPicker(true)}>
                                    <Ionicons name="calendar" size={20} color="#00686F" />
                                    <CustomText style={[styles.dateValue, !endDateText && {color: '#9CA3AF'}]}>
                                        {endDateText || "Select end date"}
                                    </CustomText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.card}>
                        <CustomText style={styles.cardTitle}>Location & Notes</CustomText>
                        <View style={styles.inputWrapper}>
                            <CustomText style={styles.label}>Venue Location</CustomText>
                            <View style={styles.locationBox}>
                                <Ionicons name="location-sharp" size={20} color="#6B7280"/>
                                <TextInput 
                                    style={styles.locationInput} 
                                    value={location} 
                                    onChangeText={setLocation} 
                                    placeholder="Search or pin venue" 
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <CustomText style={styles.label}>Description</CustomText>
                            <TextInput 
                                style={[styles.input, styles.textArea]} 
                                value={description} 
                                onChangeText={setDescription} 
                                multiline 
                                placeholder="Add any extra details..." 
                            />
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.submitButton, loading && styles.disabledButton]} 
                        onPress={handleUpdateEvent} // Fixed function name
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : <CustomText style={styles.submitButtonText}>Update Event</CustomText>}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {showStartPicker && <DateTimePicker value={startDate} mode="date" display="default" onChange={onStartChange} />}
            {showEndPicker && <DateTimePicker value={endDate} mode="date" display="default" onChange={onEndChange} minimumDate={startDate} />}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    roundButton: { padding: 8, borderRadius: 20, backgroundColor: '#F9FAFB' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
    scrollContainer: { padding: 16 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 3 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
    inputWrapper: { marginBottom: 16 },
    label: { fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: '600', textTransform: 'uppercase' },
    input: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 16, color: '#111827' },
    pickerContainer: { backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
    picker: { height: 50 },
    dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    dateValue: { marginLeft: 10, fontSize: 16, color: '#111827' },
    inlineSwitchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 10 },
    switchLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
    locationBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingLeft: 12 },
    locationInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 8, fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    submitButton: { backgroundColor: '#00686F', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
    disabledButton: { opacity: 0.6 },
    submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});