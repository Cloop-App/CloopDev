import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Platform, StatusBar, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, Notification } from '../../src/client/notifications';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { token } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');

    const loadNotifications = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await fetchNotifications(token);
            setNotifications(data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, [token]);

    const handleMarkAsRead = async (id: number) => {
        if (!token) return;
        try {
            await markNotificationAsRead(id, token);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark read:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!token) return;
        try {
            await deleteNotification(id, token);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            Alert.alert('Error', 'Failed to delete notification');
        }
    };

    const handleMarkAllRead = async () => {
        if (!token) return;
        try {
            await markAllNotificationsAsRead(token);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Failed to mark all read:', error);
        }
    };

    const handleTabPress = (tabId: string) => {
        setActiveTab(tabId);
        if (tabId === 'home') router.push('/home/home' as any);
        else if (tabId === 'statistics') router.push('/metrices/home' as any);
        else if (tabId === 'profile') router.push('/profile/profile' as any);
        else if (tabId === 'session') router.push('/chapter-topic/session' as any);
    };

    const renderItem = ({ item }: { item: Notification }) => {
        const isWelcome = item.type === 'welcome';
        const iconName = isWelcome ? 'star' : 'information-circle';
        const iconColor = isWelcome ? '#F59E0B' : '#8B5CF6';
        const bgColor = item.is_read ? '#FFFFFF' : '#F3E8FF';

        return (
            <View style={[styles.notificationCard, { backgroundColor: bgColor }]}>
                <Pressable
                    style={styles.cardContent}
                    onPress={() => handleMarkAsRead(item.id)}
                >
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: isWelcome ? '#FEF3C7' : '#EDE9FE' }]}>
                            <Ionicons name={iconName} size={24} color={iconColor} />
                        </View>
                    </View>
                    <View style={styles.textContainer}>
                        <View style={styles.cardHeader}>
                            <Text style={[styles.title, !item.is_read && styles.unreadTitle]} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
                        </View>
                        <Text style={styles.message} numberOfLines={3}>{item.message}</Text>
                        {!item.is_read && <View style={styles.unreadDot} />}
                    </View>
                </Pressable>

                {/* Delete Button */}
                <Pressable onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#8B5CF6" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.headerTitle}>Notifications</Text>
                <Pressable onPress={handleMarkAllRead} style={styles.markAllButton}>
                    <Ionicons name="checkmark-done-outline" size={24} color="#FFFFFF" />
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            ) : notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.center}>
                    <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
            )}

            {/* Bottom Navigation */}
            <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    markAllButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100, // Extra padding for bottom nav
    },
    notificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 16,
        alignItems: 'flex-start',
    },
    iconContainer: {
        marginRight: 16,
        justifyContent: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        flex: 1,
        marginRight: 8,
    },
    unreadTitle: {
        fontWeight: '800',
        color: '#1F2937',
    },
    time: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: -8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    deleteButton: {
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
    },
});
