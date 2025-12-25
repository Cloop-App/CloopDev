const prisma = require('../lib/prisma');

const createNotification = async (userId, title, message, type = 'info') => {
  try {
    const notification = await prisma.notifications.create({
      data: {
        user_id: parseInt(userId),
        title,
        message,
        type,
        is_read: false
      }
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const getUserNotifications = async (userId) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: parseInt(userId)
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    return notifications;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    throw error;
  }
};

const markNotificationAsRead = async (notificationId) => {
  try {
    const notification = await prisma.notifications.update({
      where: {
        id: parseInt(notificationId)
      },
      data: {
        is_read: true
      }
    });
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

const markAllAsRead = async (userId) => {
  try {
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: parseInt(userId),
        is_read: false
      },
      data: {
        is_read: true
      }
    });
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};
const deleteNotification = async (id) => {
  try {
    await prisma.notifications.delete({
      where: {
        id: parseInt(id)
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

const getUnreadCount = async (userId) => {
  try {
    const count = await prisma.notifications.count({
      where: {
        user_id: parseInt(userId),
        is_read: false
      }
    });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};
