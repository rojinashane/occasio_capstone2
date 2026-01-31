import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { 
    View, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView, 
    Alert, 
    TextInput,
    ActivityIndicator,
    Image,
    Modal,
    Animated, // Added Animated
    Easing    // Added Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../components/CustomText';
import { auth, db } from '../firebase';
import { updateDoc, doc, getDoc } from 'firebase/firestore';

const AVATAR_MAP = {
    'Avatar1': require('../assets/profile/Avatar1.jpg'),
    'Avatar2': require('../assets/profile/Avatar2.jpg'),
    'Avatar3': require('../assets/profile/Avatar3.jpg'),
    'Avatar4': require('../assets/profile/Avatar4.jpg'),
};

export default function ProfileScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(null);

    // --- Entrance Animations ---
    const fadeAnim = useRef(new Animated.Value(0)).current;      // Initial opacity 0
    const slideAnim = useRef(new Animated.Value(30)).current;   // Initial offset 30px
    const avatarScale = useRef(new Animated.Value(0.5)).current; // Initial scale 0.5

    useEffect(() => {
        // Start entrance animation when component mounts
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
            Animated.spring(avatarScale, {
                toValue: 1,
                friction: 7,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        fetchUserDetails();
    }, []);

    const fetchUserDetails = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFirstName(data.firstName || '');
                    setMiddleName(data.middleName || '');
                    setLastName(data.lastName || '');
                    setUsername(data.username || '');
                    setSelectedAvatar(data.avatar || null);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Could not load profile data.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!firstName.trim() || !lastName.trim() || !username.trim()) {
            Alert.alert('Error', 'Required fields are missing.');
            return;
        }
        try {
            setLoading(true);
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, { 
                firstName: firstName.trim(),
                middleName: middleName.trim(),
                lastName: lastName.trim(),
                username: username.trim().toLowerCase(),
                avatar: selectedAvatar 
            });
            setIsEditing(false);
            setShowSuccess(true);
        } catch (error) {
            Alert.alert('Error', 'Could not update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <SuccessModal 
                visible={showSuccess} 
                onClose={() => setShowSuccess(false)} 
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <CustomText style={styles.headerTitle}>My Profile</CustomText>
                <View style={{ width: 24 }} /> 
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Card with Entrance Animation */}
                <Animated.View style={[
                    styles.profileCard, 
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <Animated.View style={[styles.avatarLarge, { transform: [{ scale: avatarScale }] }]}>
                        {selectedAvatar && AVATAR_MAP[selectedAvatar] ? (
                            <Image source={AVATAR_MAP[selectedAvatar]} style={styles.avatarImg} />
                        ) : (
                            <Ionicons name="person" size={50} color="#00686F" />
                        )}
                    </Animated.View>
                    
                    {!isEditing && (
                        <View style={{ alignItems: 'center' }}>
                            <CustomText style={styles.nameText}>{`${firstName} ${lastName}`}</CustomText>
                            <CustomText style={styles.handleText}>@{username}</CustomText>
                        </View>
                    )}
                </Animated.View>

                {/* Settings Section with Entrance Animation */}
                <Animated.View style={[
                    styles.settingsSection,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                ]}>
                    <CustomText style={styles.sectionLabel}>User Information</CustomText>
                    
                    {isEditing ? (
                        <View style={styles.editForm}>
                            <CustomText style={styles.inputLabel}>Choose Avatar</CustomText>
                            <View style={styles.avatarPicker}>
                                <TouchableOpacity 
                                    onPress={() => setSelectedAvatar(null)}
                                    style={[styles.avatarOption, selectedAvatar === null && styles.selectedAvatarOption]}
                                >
                                    <View style={[styles.avatarThumb, styles.noneThumb]}>
                                        <Ionicons name="close" size={20} color="#64748B" />
                                    </View>
                                </TouchableOpacity>

                                {Object.keys(AVATAR_MAP).map((key) => (
                                    <TouchableOpacity 
                                        key={key} 
                                        onPress={() => setSelectedAvatar(key)}
                                        style={[styles.avatarOption, selectedAvatar === key && styles.selectedAvatarOption]}
                                    >
                                        <Image source={AVATAR_MAP[key]} style={styles.avatarThumb} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <InputField label="First Name" value={firstName} onChange={setFirstName} />
                            <InputField label="Middle Name" value={middleName} onChange={setMiddleName} />
                            <InputField label="Last Name" value={lastName} onChange={setLastName} />
                            <InputField label="Username" value={username} onChange={setUsername} autoCapitalize="none" />
                            
                            <View style={styles.editActions}>
                                <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => setIsEditing(false)}>
                                    <CustomText style={styles.cancelBtnText}>Cancel</CustomText>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleUpdateProfile}>
                                    <CustomText style={styles.saveBtnText}>Save</CustomText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <ProfileOption icon="person-outline" label="Edit Profile Details" onPress={() => setIsEditing(true)} />
                            <ProfileOption icon="mail-outline" label={auth.currentUser?.email} isLocked />
                        </>
                    )}
                    
                    <TouchableOpacity style={styles.returnBtn} onPress={() => navigation.navigate('Dashboard')}>
                        <Ionicons name="home-outline" size={20} color="#00686F" style={{ marginRight: 8 }} />
                        <CustomText style={styles.returnText}>Back to Dashboard</CustomText>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- Internal Components (Unchanged) ---

const SuccessModal = ({ visible, onClose }) => (
    <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.successIconCircle}>
                    <Ionicons name="checkmark" size={40} color="#FFF" />
                </View>
                <CustomText style={styles.successTitle}>Profile Updated!</CustomText>
                <CustomText style={styles.successSub}>Your changes have been saved successfully.</CustomText>
                <TouchableOpacity style={styles.successCloseBtn} onPress={onClose}>
                    <CustomText style={styles.successCloseBtnText}>Great</CustomText>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

const InputField = ({ label, value, onChange, autoCapitalize = "sentences" }) => (
    <View style={styles.inputWrapper}>
        <CustomText style={styles.inputLabel}>{label}</CustomText>
        <TextInput 
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder={`Enter ${label}`}
            placeholderTextColor="#94A3B8"
            autoCapitalize={autoCapitalize}
        />
    </View>
);

const ProfileOption = ({ icon, label, onPress, isLocked }) => (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} disabled={isLocked}>
        <View style={styles.optionIconBox}>
            <Ionicons name={icon} size={22} color="#00686F" />
        </View>
        <CustomText style={[styles.optionLabel, isLocked && { color: '#94A3B8' }]}>
            {label}
        </CustomText>
        {!isLocked && <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        backgroundColor: '#00686F',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
    },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    profileCard: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#00686F',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF',
        overflow: 'hidden',
        marginBottom: 15,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImg: { width: '100%', height: '100%' },
    avatarPicker: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, marginTop: 10 },
    avatarOption: { padding: 3, borderRadius: 30, borderWidth: 2, borderColor: 'transparent' },
    selectedAvatarOption: { borderColor: '#00686F' },
    avatarThumb: { width: 46, height: 46, borderRadius: 23 },
    noneThumb: { backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed' },
    nameText: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
    handleText: { color: '#D1FAE5', fontSize: 14, marginTop: 4 },
    settingsSection: { padding: 20 },
    sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 15, marginLeft: 5 },
    optionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, marginBottom: 10 },
    optionIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    optionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1E293B' },
    editForm: { backgroundColor: '#FFF', padding: 15, borderRadius: 20 },
    inputWrapper: { marginBottom: 15 },
    inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 5, marginLeft: 5 },
    input: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, color: '#1E293B', fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    editActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    saveBtn: { backgroundColor: '#00686F' },
    cancelBtn: { backgroundColor: '#F1F5F9' },
    saveBtnText: { color: '#FFF', fontWeight: 'bold' },
    cancelBtnText: { color: '#64748B', fontWeight: 'bold' },
    returnBtn: { marginTop: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    returnText: { color: '#00686F', fontWeight: 'bold', fontSize: 16 },

    // --- Success Modal Styles ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 10
    },
    successSub: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22
    },
    successCloseBtn: {
        backgroundColor: '#00686F',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 12
    },
    successCloseBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16
    }
});