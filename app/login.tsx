import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../hooks/useAuthStore';
import { authApi, userApi } from '../api';
import { ToastNotification } from '../components/ToastNotification';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function LoginScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Email, 2: OTP
    const [loading, setLoading] = useState(false);

    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleRequestOTP = async () => {
        if (!email || !name.trim()) {
            Alert.alert('Error', 'Please enter your name and email address');
            return;
        }

        setLoading(true);
        try {
            console.log('Sending OTP request to:', email);
            await authApi.requestOTP(email, name);

            // Show custom toast instead of alert, simulating a message
            setToastMessage(`A verification code has been sent to ${email}`);
            setToastVisible(true);

            setStep(2);
        } catch (error: any) {
            console.error('Login Error:', error);

            Alert.alert('Error', error.response?.data?.message || 'Could not connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    const { setAuth } = useAuthStore();

    const handleVerifyOTP = async () => {
        if (!otp) {
            Alert.alert('Error', 'Please enter the OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.verifyOTP(email, otp);
            const { token, user } = response.data;

            // Hide the OTP toast on success
            setToastVisible(false);

            if (name && !user.name) {
                try {
                    // Temporarily set it so the name update can use the token from store
                    // or we can just pass the name in the update
                    const formData = new FormData();
                    formData.append('name', name);

                    // We need to set the token manually in API header if interceptors haven't run yet
                    // but setAuth will handle storage. 
                    // Let's just update the store FIRST.
                    await setAuth(token, user);

                    await userApi.updateProfile(formData);
                    const updatedUser = { ...user, name };
                    await setAuth(token, updatedUser);
                } catch (err) {
                    console.log("Failed to update name:", err);
                    await setAuth(token, user);
                }
            } else {
                await setAuth(token, user);
            }

            router.replace('/(tabs)/home');
        } catch (error: any) {
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ToastNotification
                visible={toastVisible}
                message={toastMessage}
                onDismiss={() => setToastVisible(false)}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => {
                        if (step === 2) {
                            setStep(1);
                        } else if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace('/');
                        }
                    }}
                >
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>

                <View style={styles.content}>
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <Text style={styles.title}>{step === 1 ? 'Welcome to Talkies' : 'Verify Email'}</Text>
                        <Text style={styles.subtitle}>
                            {step === 1
                                ? 'Join thousands of people chatting around the world.'
                                : `Enter the 6-digit code sent to ${email}.`}
                        </Text>
                    </Animated.View>

                    {step === 1 && (
                        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputSection}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#64748b" />
                                <TextInput
                                    placeholder="Enter your name"
                                    placeholderTextColor="#94a3b8"
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#64748b" />
                                <TextInput
                                    placeholder="Enter your email address"
                                    placeholderTextColor="#94a3b8"
                                    style={styles.input}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={handleRequestOTP}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Text style={styles.primaryBtnText}>Get OTP</Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                    </>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.infoText}>We'll send you a 6-digit verification code.</Text>
                        </Animated.View>
                    )}

                    {step === 2 && (
                        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputSection}>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                                <TextInput
                                    placeholder="Enter 6-digit OTP"
                                    placeholderTextColor="#94a3b8"
                                    style={styles.input}
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={handleVerifyOTP}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Text style={styles.primaryBtnText}>Verify & Continue</Text>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.resendBtn} onPress={handleRequestOTP}>
                                <Text style={styles.resendText}>Didn't receive code? Resend</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    keyboardView: {
        flex: 1,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 20,
        marginTop: 10,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 30,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1e293b',
        letterSpacing: -0.8,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 6,
        lineHeight: 20,
    },
    inputSection: {
        marginTop: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 52,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '500',
    },
    primaryBtn: {
        backgroundColor: '#6366f1',
        height: 52,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#6366f1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0px 4px 10px rgba(99, 102, 241, 0.2)',
            }
        }),
        marginTop: 8,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    infoText: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 12,
        marginTop: 16,
    },
    resendBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    resendText: {
        color: '#6366f1',
        fontSize: 14,
        fontWeight: '700',
    },
});
