import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { userApi, authApi } from '../../api';
import { BASE_URL } from '../../constants/Config';
import Animated, {
    FadeInDown,
    FadeInRight,
} from 'react-native-reanimated';
import { disconnectSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../hooks/useAuthStore';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
    const { user, clearAuth, setAuth, token } = useAuthStore();

    const fetchUserData = async () => {
        try {
            const response = await userApi.getMe();
            const userData = response.data.user;
            // Update store with fresh data from server
            if (token && userData) {
                await setAuth(token, userData);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchUserData();
        }, [])
    );

    const handleLogout = async () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to log out?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // 1. Notify server FIRST while we still have the token
                            try {
                                await authApi.logout();
                            } catch (e) {
                                console.log('Server logout failed (likely token already expired)');
                            }

                            // 2. Disconnect socket
                            disconnectSocket();

                            // 3. Clear store and storage
                            await clearAuth();

                            // 4. Redirect to landing
                            router.replace('/');
                        } catch (error) {
                            console.error('Logout error:', error);
                            // Emergency clear and redirect
                            await clearAuth();
                            router.replace('/');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const menuItems = [
        {
            id: 'edit',
            title: 'Edit Profile',
            icon: 'person-outline' as const,
            onPress: () => router.push('/profileedit'),
            color: '#4F46E5',
        },
        {
            id: 'settings',
            title: 'Settings',
            icon: 'settings-outline' as const,
            onPress: () => { },
            color: '#6B7280',
        },
        {
            id: 'logout',
            title: 'Logout',
            icon: 'log-out-outline' as const,
            onPress: handleLogout,
            color: '#EF4444',
            isDestructive: true,
        },
    ];

    if (!user) return null;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.headerBackground} />

                <View style={styles.profileSection}>
                    <Animated.View
                        entering={FadeInDown.delay(200).springify()}
                        style={styles.imageContainer}
                    >
                        <Image
                            source={
                                user.profile_image
                                    ? (user.profile_image.startsWith('http') || user.profile_image.startsWith('file')
                                        ? user.profile_image
                                        : `${BASE_URL.replace(/\/$/, '')}/${user.profile_image.replace(/^\//, '')}`)
                                    : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name || user.email)
                            }
                            style={styles.profileImage}
                            contentFit="cover"
                        />
                        {user.is_online === 'online' && (
                            <View style={styles.onlineBadge}>
                                <View style={styles.onlineDot} />
                            </View>
                        )}
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(300).springify()}
                        style={styles.infoContainer}
                    >
                        <Text style={styles.name}>{user.name || user.email}</Text>
                        <Text style={styles.statusText}>{user.is_online === 'online' ? 'Active Now' : 'Offline'}</Text>
                    </Animated.View>
                </View>

                <Animated.View
                    entering={FadeInDown.delay(400).springify()}
                    style={styles.detailsCard}
                >
                    <View style={styles.detailItem}>
                        <View style={styles.iconBox}>
                            <Ionicons name="call-outline" size={20} color="#6366F1" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Mobile Number</Text>
                            <Text style={styles.detailValue}>{user.number}</Text>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.detailItem}>
                        <View style={styles.iconBox}>
                            <Ionicons name="mail-outline" size={20} color="#6366F1" />
                        </View>
                        <View>
                            <Text style={styles.detailLabel}>Email</Text>
                            <Text style={styles.detailValue}>{user.email || 'Not set'}</Text>
                        </View>
                    </View>
                </Animated.View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    {menuItems.map((item, index) => (
                        <Animated.View
                            key={item.id}
                            entering={FadeInRight.delay(500 + index * 100).springify()}
                        >
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={item.onPress}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.menuIconBox, { backgroundColor: item.isDestructive ? '#FEE2E2' : '#F3F4F6' }]}>
                                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                                </View>
                                <Text style={[styles.menuItemText, item.isDestructive && { color: '#EF4444' }]}>
                                    {item.title}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                            </TouchableOpacity>
                        </Animated.View>
                    ))}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    headerBackground: {
        height: 140,
        backgroundColor: '#4F46E5',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    profileSection: {
        alignItems: 'center',
        marginTop: 40,
    },
    imageContainer: {
        position: 'relative',
        padding: 3,
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            }
        }),
    },
    profileImage: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#FFFFFF',
        padding: 2,
        borderRadius: 10,
    },
    onlineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22C55E',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    infoContainer: {
        alignItems: 'center',
        marginTop: 12,
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    statusText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 2,
    },
    detailsCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 24,
        borderRadius: 16,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
            }
        }),
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        marginBottom: 1,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    menuSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
        marginLeft: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 14,
        marginBottom: 8,
    },
    menuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
});

export default ProfileScreen;
