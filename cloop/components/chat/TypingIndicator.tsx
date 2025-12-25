
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { THEME } from '../../src/constants/theme';

interface Props {
    backgroundColor?: string;
    borderColor?: string;
}

export default function TypingIndicator({ backgroundColor = '#fff', borderColor = THEME.colors.border }: Props) {
    const dot1Opacity = useRef(new Animated.Value(0.4)).current;
    const dot2Opacity = useRef(new Animated.Value(0.4)).current;
    const dot3Opacity = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const animate = (anim: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 400,
                        delay: delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0.4,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        animate(dot1Opacity, 0);
        animate(dot2Opacity, 200);
        animate(dot3Opacity, 400);
    }, []);

    return (
        <View style={[styles.container, { backgroundColor, borderColor }]}>
            <Text style={styles.text}>Typing</Text>
            <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        alignSelf: 'flex-start',
        marginLeft: 16,
        marginBottom: 8,
        gap: 4,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: THEME.colors.text.secondary,
        marginTop: 4,
    },
    text: {
        fontSize: 14,
        color: THEME.colors.text.secondary,
        marginBottom: 2,
    },
});
