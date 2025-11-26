import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { THEME } from '../src/constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingCardProps {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    backgroundColor?: string;
}

export default function OnboardingCard({
    title,
    subtitle,
    children,
    backgroundColor = THEME.colors.surface
}: OnboardingCardProps) {
    return (
        <View style={[styles.container, { backgroundColor }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {title && <Text style={styles.title}>{title}</Text>}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                {children}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: width,
        flex: 1,
        paddingHorizontal: THEME.spacing.l,
    },
    scrollContent: {
        paddingVertical: THEME.spacing.l,
        paddingBottom: 100, // Space for bottom nav
        alignItems: 'center',
    },
    title: {
        ...THEME.typography.h2,
        textAlign: 'center',
        marginBottom: THEME.spacing.s,
        color: THEME.colors.text.primary,
    },
    subtitle: {
        ...THEME.typography.body,
        textAlign: 'center',
        marginBottom: THEME.spacing.xl,
        color: THEME.colors.text.secondary,
        paddingHorizontal: THEME.spacing.m,
    },
});
