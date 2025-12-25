import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface BottomNavigationProps {
    activeTab: string;
    onTabPress: (tabId: string) => void;
}

interface TabItem {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItem[] = [
    { id: 'home', label: 'Home', icon: 'home-outline' },
    { id: 'session', label: 'Sessions', icon: 'chatbubbles-outline' },
    { id: 'statistics', label: 'Statistics', icon: 'stats-chart-outline' },
    { id: 'profile', label: 'Profile', icon: 'person-outline' },
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {

    const handlePress = (tabId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onTabPress(tabId);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tab, isActive && styles.activeTab]}
                            onPress={() => handlePress(tab.id)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isActive ? (tab.icon.replace('-outline', '') as any) : tab.icon}
                                size={24}
                                color={isActive ? '#1F2937' : '#FFFFFF'}
                            />
                            {isActive && (
                                <Text style={styles.label} numberOfLines={1}>
                                    {tab.label}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 0,
        paddingBottom: 0,
        paddingTop: 0,
        backgroundColor: 'transparent',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    content: {
        flexDirection: 'row',
        backgroundColor: '#8B5CF6', // Purple background
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16, // More height
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        width: '100%',
        minHeight: 80, // Enforce minimum height if needed
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20, // Pill shape
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: '#FFFFFF', // White background for active pill
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    label: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
});
