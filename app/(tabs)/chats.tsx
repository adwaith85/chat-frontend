import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  ActivityIndicator,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { Image } from 'expo-image';
import { userApi } from "../../api";
import { useAuthStore } from "../../hooks/useAuthStore";
import { BASE_URL } from "../../constants/Config";

export default function ChatsScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user: currentUser } = useAuthStore();
  const myId = currentUser?.user_id;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userApi.getUsers();
        // Filter out myself
        const otherUsers = response.data.users ? response.data.users.filter((u: any) => u.user_id !== myId) : [];
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) {
      setFilteredUsers(users);
      return;
    }
    const filtered = users.filter(u =>
      (u.email && u.email.toLowerCase().includes(text.toLowerCase())) ||
      (u.number && u.number.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredUsers(filtered);
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => router.push({
        pathname: "/chat/[id]",
        params: { id: item.user_id, name: item.name || item.email, image: item.profile_image }
      })}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={
            item.profile_image
              ? (item.profile_image.startsWith('http') || item.profile_image.startsWith('file')
                ? item.profile_image
                : `${BASE_URL.replace(/\/$/, '')}/${item.profile_image.replace(/^\//, '')}`)
              : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.name || item.email)
          }
          style={styles.avatar}
        />
        {item.is_online === 'online' && <View style={styles.onlineBadge} />}
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || item.email}</Text>
        <Text style={styles.userStatus}>
          {item.is_online === 'online' ? 'Available' : 'Seen ' + (item.last_seen ? new Date(item.last_seen).toLocaleDateString() : 'recently')}
        </Text>
      </View>

      <Ionicons name="chatbubble-outline" size={22} color="#6366f1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by email or number..."
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.user_id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#e2e8f0" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 13,
    color: '#94a3b8',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  }
});