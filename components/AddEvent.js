import React, { useState } from 'react';
import {
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from './CustomText';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AddEvent({ navigation }) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreateEvent = async () => {
        if (!title || !date || !location) {
            Alert.alert('Required Fields', 'Please fill in the Title, Date, and Location.');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'events'), {
                userId: auth.currentUser.uid,
                title,
                date,
                location,
                description,
                createdAt: serverTimestamp(),
            });
            Alert.alert('Success', 'Event created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error adding event: ', error);
            Alert.alert('Error', 'Failed to create event. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <CustomText style={styles.headerTitle}>Create New Event</CustomText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.inputGroup}>
                    <CustomText style={styles.label}>Event Title *</CustomText>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="e.g., Beach Wedding"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <CustomText style={styles.label}>Date *</CustomText>
                    <TextInput
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="e.g., December 12, 2025"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <CustomText style={styles.label}>Location *</CustomText>
                    <TextInput
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="e.g., Boracay, Philippines"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <CustomText style={styles.label}>Description</CustomText>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        placeholder="Tell us more about the event..."
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleCreateEvent}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <CustomText style={styles.submitButtonText}>Create Event</CustomText>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#EFF0EE' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        backgroundColor: '#FFF'
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    scrollContainer: { padding: 20 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '600' },
    input: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', fontSize: 16 },
    textArea: { height: 100, textAlignVertical: 'top' },
    submitButton: {
        backgroundColor: '#00686F',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        elevation: 2
    },
    disabledButton: { opacity: 0.7 },
    submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});