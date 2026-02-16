import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { SOCKET_URL } from '../constants/Config';

let socketInstance: Socket | null = null;

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const initSocket = async () => {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            if (socketInstance) {
                setIsConnected(socketInstance.connected);
                if (socketInstance.connected) {
                    socketInstance.emit('authenticate', token);
                }
                return;
            }

            socketInstance = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true,
            });

            const handleConnect = () => {
                console.log('Socket connected');
                setIsConnected(true);
                socketInstance?.emit('authenticate', token);
            };

            socketInstance.on('connect', handleConnect);

            socketInstance.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                setIsConnected(false);

                // Only redirect if the disconnection was unintentional (e.g., server down)
                // and we still have a token (meaning we should be logged in)
                if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
                    AsyncStorage.getItem('token').then(token => {
                        if (token) {
                            router.replace('/+not-found');
                        }
                    });
                }
            });

            socketInstance.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                setIsConnected(false);
            });

            // If already connected during initialization
            if (socketInstance.connected) {
                handleConnect();
            }
        };

        initSocket();

        // No cleanup here to maintain a single instance
    }, []);

    return { socket: socketInstance, isConnected };
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};
