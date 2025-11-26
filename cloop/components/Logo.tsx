import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../src/constants/theme';

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
    showText?: boolean;
}

export default function Logo({ size = 'medium', color = THEME.colors.primary, showText = true }: LogoProps) {
    const getDimensions = () => {
        switch (size) {
            case 'small': return { width: 32, height: 32, fontSize: 18, radius: 8 };
            case 'large': return { width: 80, height: 80, fontSize: 40, radius: 20 };
            default: return { width: 48, height: 48, fontSize: 28, radius: 12 };
        }
    };

    const dims = getDimensions();

    return (
        <View style={styles.container}>
            <View style={[
                styles.logoBox,
                {
                    width: dims.width,
                    height: dims.height,
                    borderRadius: dims.radius,
                    backgroundColor: color
                }
            ]}>
                <Text style={[styles.logoLetter, { fontSize: dims.fontSize }]}>C</Text>
            </View>
            {showText && (
                <Text style={[
                    styles.brandText,
                    {
                        fontSize: size === 'large' ? 32 : size === 'small' ? 18 : 24,
                        color: THEME.colors.text.primary
                    }
                ]}>
                    Cloop
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoBox: {
        alignItems: 'center',
        justifyContent: 'center',
        ...THEME.shadows.medium,
    },
    logoLetter: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
    },
    brandText: {
        fontWeight: '900',
        marginTop: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
    },
});

import { Platform } from 'react-native';
