import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import { chatApi } from "../../api";
import { useSocket } from "../../hooks/useSocket";
import { useAuthStore } from "../../hooks/useAuthStore";
import { BASE_URL } from "../../constants/Config";

export default function Home() {
  const { user } = useAuthStore();
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket();

  const loadData = async () => {
    try {
      const response = await chatApi.getRecentChats();
      setRecentChats(response.data);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (socket) {
      const handleNewMessage = () => {
        loadData();
      };

      const handleUserStatus = (data: any) => {
        setRecentChats(prev => prev.map(chat =>
          chat.user_id === data.user_id ? { ...chat, is_online: data.is_online } : chat
        ));
      };

      socket.on('receive_message', handleNewMessage);
      socket.on('message_sent', handleNewMessage);
      socket.on('user_status', handleUserStatus);

      return () => {
        socket.off('receive_message', handleNewMessage);
        socket.off('message_sent', handleNewMessage);
        socket.off('user_status', handleUserStatus);
      };
    }
  }, [socket]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => router.push({
        pathname: "/chat/[id]",
        params: { id: item.user_id, name: item.name || item.number, image: item.profile_image }
      })}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={
            item.profile_image
              ? (item.profile_image.startsWith('http') || item.profile_image.startsWith('file')
                ? item.profile_image
                : `${BASE_URL.replace(/\/$/, '')}/${item.profile_image.replace(/^\//, '')}`)
              : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.name || item.number)
          }
          style={styles.chatAvatar}
        />
        {item.is_online === 'online' && <View style={styles.onlineBadge} />}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>{item.name || item.number}</Text>
          <Text style={styles.chatTime}>
            {item.last_message_time ? new Date(item.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || 'No messages yet'}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Hello, {user?.name || 'Explorer'}</Text>
          <Text style={styles.appNameText}>Talkies</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Ionicons name="search-outline" size={26} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={recentChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.user_id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.illustrationWrap}>
                <View style={styles.circle1} />
                <View style={styles.circle2} />
                <Ionicons name="chatbubbles-outline" size={80} color="#e2e8f0" />
              </View>
              <Text style={styles.emptyTitle}>No Conversations Yet</Text>
              <Text style={styles.emptySubtitle}>
                Start a new chat with someone and keep the conversation going!
              </Text>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => router.push('/chats')}
              >
                <Text style={styles.primaryActionText}>Start Chatting</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/chats')}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  appNameText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: -0.8,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    paddingTop: 5,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarContainer: {
    position: 'relative',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 14,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  chatTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#6366f1',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingHorizontal: 30,
  },
  illustrationWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  circle1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#EEF2FF",
    opacity: 0.6,
  },
  circle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0E7FF",
    opacity: 0.7,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 8,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryActionBtn: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0px 4px 8px rgba(99, 102, 241, 0.2)",
      }
    }),
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0px 6px 10px rgba(99, 102, 241, 0.25)",
      }
    }),
  },
});
