import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '../../constants/Config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import { userApi } from '../../api';
import Animated, { FadeInDown } from 'react-native-reanimated';

// InputField extracted outside ProfileEditScreen to prevent re-creation on every render
// (which was causing the keyboard to dismiss on each keystroke)
const InputField = ({ label, value, onChangeText, icon, keyboardType = 'default', editable = true }: any) => (
    <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputWrapper, !editable && styles.disabledInput]}>
            <Ionicons name={icon} size={20} color={editable ? "#6366F1" : "#94A3B8"} style={styles.inputIcon} />
            <TextInput
                style={[styles.input, !editable && { color: '#94A3B8' }]}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
                placeholderTextColor="#9CA3AF"
                editable={editable}
            />
        </View>
    </View>
);

const ProfileEditScreen = () => {
    const { user, setAuth, token } = useAuthStore();
    const [formData, setFormData] = useState({
        email: '',
        profile_image: null as any, // File object or uri string from picker
        number: '',
        name: '',
    });
    const [displayImage, setDisplayImage] = useState(''); // For showing current/selected image
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                profile_image: null,
                number: user.number || '',
                name: user.name || '',
            });
            setDisplayImage(user?.profile_image?.uri || '');
        }
    }, [user]);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setFormData({ ...formData, profile_image: result.assets[0] });
            setDisplayImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('number', formData.number);

            if (formData.profile_image?.uri) {
                data.append('profile_image', {
                    uri: formData.profile_image.uri,
                    name: `profile_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                } as any);
            }

            const response = await userApi.updateProfile(data);

            // Update store with response from server
            if (response.data.user && token) {
                // Merge existing with new updates
                const updated = { ...user, ...response.data.user };
                await setAuth(token, updated);
            }

            Alert.alert('Success', 'Profile updated successfully');
            router.back();
        } catch (error: any) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleSave} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#4F46E5" />
                        ) : (
                            <Text style={styles.saveText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps='handled'>
                    {/* Profile Image Section */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={styles.avatarSection}
                    >
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={
                                    displayImage
                                        ? (displayImage.startsWith('http') || displayImage.startsWith('file')
                                            ? displayImage
                                            : `${BASE_URL.replace(/\/$/, '')}/${displayImage.replace(/^\//, '')}`)
                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=random`
                                }
                                style={styles.avatar}
                                contentFit="cover"
                            />
                            <TouchableOpacity style={styles.editBadge} onPress={pickImage}>
                                <Ionicons name="camera" size={18} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.changePhotoText}>Tap icon to change photo</Text>
                    </Animated.View>

                    {/* Form Section */}
                    <View style={styles.formSection}>
                        <Animated.View entering={FadeInDown.delay(200).springify()}>
                            <InputField
                                label="Full Name"
                                value={formData.name}
                                onChangeText={(text: string) => setFormData({ ...formData, name: text })}
                                icon="person-outline"
                            />
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300).springify()}>
                            <InputField
                                label="Phone Number"
                                value={formData.number}
                                onChangeText={(text: string) => setFormData({ ...formData, number: text })}
                                icon="call-outline"
                                keyboardType="phone-pad"
                            />
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(400).springify()}>
                            <InputField
                                label="Email Address (Verified)"
                                value={formData.email}
                                icon="mail-outline"
                                editable={false}
                            />
                        </Animated.View>
                    </View>

                    <Animated.View
                        entering={FadeInDown.delay(500).springify()}
                        style={styles.infoBox}
                    >
                        <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
                        <Text style={styles.infoBoxText}>
                            Your email address is verified and cannot be changed. You can update your name, phone number and profile picture.
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    saveText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4F46E5',
    },
    scrollContent: {
        paddingBottom: 30,
    },
    avatarSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 36,
        borderWidth: 3,
        borderColor: '#F3F4F6',
    },
    editBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#4F46E5',
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    imageUrlInput: {
        width: '75%',
        height: 36,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'center',
    },
    formSection: {
        paddingHorizontal: 16,
        marginTop: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 6,
        marginLeft: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        height: 48,
    },
    disabledInput: {
        backgroundColor: '#F9FAFB',
        borderColor: '#F3F4F6',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EEF2FF',
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    infoBoxText: {
        flex: 1,
        fontSize: 12,
        color: '#4F46E5',
        marginLeft: 10,
        lineHeight: 16,
        fontWeight: '500',
    },
    changePhotoText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 12,
    },
});

export default ProfileEditScreen;
