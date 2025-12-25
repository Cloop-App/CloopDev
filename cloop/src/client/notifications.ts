import { API_BASE_URL } from '../config/api';


export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
}

export const fetchNotifications = async (token: string): Promise<Notification[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return await response.json();
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const markNotificationAsRead = async (id: number, token: string): Promise<void> => {
    try {
        await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const markAllNotificationsAsRead = async (token: string): Promise<void> => {
    try {
        await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

export const deleteNotification = async (id: number, token: string): Promise<void> => {
    try {
        await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};

export const getUnreadNotificationCount = async (token: string): Promise<number> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch unread count');
        const data = await response.json();
        return data.count;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return 0;
    }
};
