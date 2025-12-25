import AsyncStorage from '@react-native-async-storage/async-storage';
import { NormalChatMessage } from '../client/normal-chat/normal-chat';

export interface ChatSession {
    id: string; // Timestamp or UUID
    title: string;
    preview: string;
    messages: NormalChatMessage[];
    lastModified: number;
}

const STORAGE_KEY = 'cloop_chat_history';

export const saveChatSession = async (messages: NormalChatMessage[]) => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    const firstMsg = messages[0]; // Or find first user message for title

    const session: ChatSession = {
        id: Date.now().toString(),
        title: firstMsg.message || 'New Chat',
        preview: lastMsg.message || '',
        messages: messages,
        lastModified: Date.now(),
    };

    try {
        const existing = await getChatSessions();
        const updated = [session, ...existing];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Failed to save chat', e);
        return [];
    }
};

export const getChatSessions = async (): Promise<ChatSession[]> => {
    try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        return [];
    }
};

export const deleteChatSession = async (id: string) => {
    const sessions = await getChatSessions();
    const filtered = sessions.filter(s => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
};

export const clearAllSessions = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
};
