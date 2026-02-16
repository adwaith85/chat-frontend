import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
    visible: boolean;
    message: string;
    onDismiss: () => void;
}

export function ToastNotification({ visible, message, onDismiss }: ToastProps) {
    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeInUp.springify()}
            exiting={FadeOutUp}
            style={styles.container}
        >
            <View style={styles.toast}>
                <View style={styles.iconContainer}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#6366f1" />
                </View>
                <TouchableOpacity style={styles.content} onPress={onDismiss} activeOpacity={0.8}>
                    <Text style={styles.title}>New Message</Text>
                    <Text style={styles.message}>{message}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
                    <Ionicons name="close" size={20} color="#94a3b8" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        zIndex: 9999, // Ensure it is on top
        alignItems: 'center',
    },
    toast: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    message: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    closeBtn: {
        padding: 8,
        marginLeft: 4,
    }
});
