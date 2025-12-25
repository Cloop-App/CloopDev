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

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
    const insets = useSafeAreaInsets();
    // Default height 80 + bottom inset
    const height = 80 + Math.max(insets.bottom, 10);

    const handlePress = (tabId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        onTabPress(tabId);
    };

    return (
        <View style={[styles.container, { height }]}>
            <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 10) }]}>
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
                                size={28}
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
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    content: {
        flexDirection: 'row',
        backgroundColor: '#8B5CF6', // Purple background
        borderRadius: 0, // Rectangular
        paddingHorizontal: 20,
        paddingTop: 10, // Add top padding for balance
        width: '100%',
        height: '100%',
        alignItems: 'flex-start', // Align items to top to handle dynamic height
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
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
        paddingVertical: 12,
    },
    label: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        fontFamily: 'System', // Fallback or use specific font family if available
    },
});
