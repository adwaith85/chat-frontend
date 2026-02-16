import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { chatApi, userApi } from '../../api';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../hooks/useAuthStore';
import { BASE_URL } from '../../constants/Config';
import { Alert } from 'react-native';

export default function ChatScreen() {
    const { id, name, image } = useLocalSearchParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    const myId = user?.user_id;
    const [isOnline, setIsOnline] = useState(false);
    const { socket } = useSocket();
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        const init = async () => {
            fetchMessages();
        };

        const handleReceiveMessage = (message: any) => {
            if (message.sender_id === Number(id)) {
                setMessages(prev => [...prev, message]);
                chatApi.updateMessageStatus(message.message_id, 'read');
            }
        };

        const handleMessageSent = (message: any) => {
            setMessages(prev => {
                const exists = prev.some(m => m.message_id === message.message_id);
                if (exists) return prev;
                return prev.map(m =>
                    (m.status === 'sending' && m.message === message.message) ? message : m
                );
            });
        };

        const handleUserStatus = (data: any) => {
            if (data.user_id === Number(id)) {
                setIsOnline(data.is_online === 'online');
            }
        };

        if (socket) {
            socket.on('receive_message', handleReceiveMessage);
            socket.on('message_sent', handleMessageSent);
            socket.on('user_status', handleUserStatus);
        }

        init();

        return () => {
            if (socket) {
                socket.off('receive_message', handleReceiveMessage);
                socket.off('message_sent', handleMessageSent);
                socket.off('user_status', handleUserStatus);
            }
        };
    }, [id, socket]);

    const fetchMessages = async () => {
        try {
            const response = await chatApi.getMessages(Number(id));
            setMessages(response.data);

            // Also fetch user details to check online status
            const userResponse = await userApi.getUserById(id as string);
            setIsOnline(userResponse.data.user.is_online === 'online');
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !myId || !socket) return;

        const messageData = {
            receiver_id: Number(id),
            message: input.trim(),
            message_type: 'text'
        };

        try {
            // Optimistic update
            const tempId = Date.now();
            const optimisticMessage = {
                message_id: tempId,
                sender_id: myId,
                receiver_id: Number(id),
                message: input.trim(),
                message_type: 'text',
                status: 'sending',
                sent_at: new Date()
            };
            setMessages(prev => [...prev, optimisticMessage]);
            setInput('');

            // Send via socket
            socket.emit('send_message', messageData);
        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message');
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id === myId;
        return (
            <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.theirMessageWrapper]}>
                <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                        {item.message}
                    </Text>
                    <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.theirTimeText]}>
                        {new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366f1" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>

                <View style={styles.userInfo}>
                    <Image
                        source={
                            image
                                ? (String(image).startsWith('http') || String(image).startsWith('file')
                                    ? String(image)
                                    : `${BASE_URL.replace(/\/$/, '')}/${String(image).replace(/^\//, '')}`)
                                : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(String(name))
                        }
                        style={styles.avatar}
                    />
                    <View style={styles.userTextInfo}>
                        <Text style={styles.userName}>{name}</Text>
                        <Text style={[styles.statusText, isOnline && styles.onlineText]}>
                            {isOnline ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.moreBtn}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#1e293b" />
                </TouchableOpacity>
            </View>

            {/* Chat Content */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.message_id.toString()}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.inputArea}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Ionicons name="add" size={28} color="#64748b" />
                    </TouchableOpacity>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message..."
                            value={input}
                            onChangeText={setInput}
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!input.trim()}
                    >
                        <Ionicons name="send" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backBtn: {
        padding: 4,
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
    },
    userTextInfo: {
        marginLeft: 10,
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    statusText: {
        fontSize: 10,
        color: '#64748b',
    },
    onlineText: {
        color: '#22C55E',
        fontWeight: '600',
    },
    moreBtn: {
        padding: 4,
    },
    messagesList: {
        padding: 12,
        paddingBottom: 20,
    },
    messageWrapper: {
        marginBottom: 8,
        flexDirection: 'row',
    },
    myMessageWrapper: {
        justifyContent: 'flex-end',
    },
    theirMessageWrapper: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '85%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    myBubble: {
        backgroundColor: '#6366f1',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 18,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#1e293b',
    },
    timeText: {
        fontSize: 9,
        marginTop: 2,
        alignSelf: 'flex-end',
    },
    myTimeText: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    theirTimeText: {
        color: '#94a3b8',
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    attachBtn: {
        padding: 6,
    },
    inputContainer: {
        flex: 1,
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginHorizontal: 4,
        maxHeight: 80,
    },
    input: {
        fontSize: 14,
        color: '#1e293b',
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#6366f1',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#6366f1',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0px 2px 4px rgba(99, 102, 241, 0.15)',
            }
        }),
    },
    sendBtnDisabled: {
        backgroundColor: '#E2E8F0',
        elevation: 0,
        shadowOpacity: 0,
    },
});
