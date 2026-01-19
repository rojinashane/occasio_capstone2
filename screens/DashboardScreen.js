// screens/DashboardScreen.js
import React, { useEffect, useState } from 'react';
import {
    View,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import tw from 'twrnc';
import CustomText from '../components/CustomText';

// Firebase
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function DashboardScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                // Fetch the document from 'users' collection using the UID
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    console.log("No such document!");
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            Alert.alert("Error", "Could not load profile data.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigation.replace('Login');
        } catch (error) {
            Alert.alert("Logout Error", error.message);
        }
    };

    if (loading) {
        return (
            <View style={tw`flex-1 justify-center items-center bg-[#00686F]`}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={tw`flex-1 bg-gray-50`}>
            <ScrollView contentContainerStyle={tw`p-6`}>

                {/* Header Section */}
                <View style={tw`mb-8 mt-4`}>
                    <CustomText fontFamily="Poppins-SemiBold" style={tw`text-[#00686F] text-3xl`}>
                        Dashboard
                    </CustomText>
                    <CustomText style={tw`text-gray-500 text-lg`}>
                        Welcome back, {userData?.firstName || 'User'}!
                    </CustomText>
                </View>

                {/* Profile Card */}
                <View style={tw`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6`}>
                    <CustomText style={tw`text-gray-400 uppercase text-xs mb-4 font-bold`}>
                        Profile Details
                    </CustomText>

                    <View style={tw`mb-4`}>
                        <CustomText style={tw`text-gray-500 text-sm`}>Full Name</CustomText>
                        <CustomText style={tw`text-black text-lg`}>
                            {userData?.firstName} {userData?.middleName ? `${userData.middleName} ` : ''}{userData?.lastName}
                        </CustomText>
                    </View>

                    <View style={tw`mb-4`}>
                        <CustomText style={tw`text-gray-500 text-sm`}>Username</CustomText>
                        <CustomText style={tw`text-black text-lg`}>@{userData?.username}</CustomText>
                    </View>

                    <View>
                        <CustomText style={tw`text-gray-500 text-sm`}>Email</CustomText>
                        <CustomText style={tw`text-black text-lg`}>{userData?.email}</CustomText>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={handleLogout}
                    style={tw`bg-red-50 py-4 rounded-2xl border border-red-100`}
                >
                    <CustomText style={tw`text-red-600 text-center font-bold text-lg`}>
                        Log Out
                    </CustomText>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}