import { API_BASE_URL } from '../../config/api';
import { Topic, Chapter, Subject } from '../chapters/chapters';

export interface SavedTopic {
    id: number;
    user_id: number;
    topic_id: number;
    created_at: string;
    topics: Topic & {
        chapters: Chapter;
        subjects: Subject;
    };
}

export const fetchSavedTopics = async (
    userId: number,
    token?: string
): Promise<SavedTopic[]> => {
    const url = new URL(`${API_BASE_URL}/api/saved-topics`);
    url.searchParams.set('userId', String(userId));

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
        throw new Error('Failed to fetch saved topics');
    }

    return response.json();
};

export const saveTopic = async (
    userId: number,
    topicId: number,
    token?: string
): Promise<SavedTopic> => {
    const url = `${API_BASE_URL}/api/saved-topics/save`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId, topicId }),
    });

    if (!response.ok) {
        throw new Error('Failed to save topic');
    }

    return response.json();
};

export const unsaveTopic = async (
    userId: number,
    topicId: number,
    token?: string
): Promise<void> => {
    const url = `${API_BASE_URL}/api/saved-topics/unsave`;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ userId, topicId }),
    });

    if (!response.ok) {
        throw new Error('Failed to unsave topic');
    }
};
