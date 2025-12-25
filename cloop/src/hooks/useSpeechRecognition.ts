import { useState, useCallback, useRef, useEffect } from 'react';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from '@jamsch/expo-speech-recognition';

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            const permission = await ExpoSpeechRecognitionModule.getPermissionsAsync();
            setHasPermission(permission.granted);
        };
        checkPermission();
    }, []);

    useSpeechRecognitionEvent('start', () => setIsListening(true));
    useSpeechRecognitionEvent('end', () => setIsListening(false));
    useSpeechRecognitionEvent('result', (event) => {
        setTranscript(event.results[0]?.transcript || '');
    });
    useSpeechRecognitionEvent('error', (event) => {
        console.log('speech error', event);
        // event.error is the string code (e.g. "aborted", "no-speech")
        setError(event.error ? String(event.error) : 'Speech recognition error');
        setIsListening(false);
    });

    const requestPermission = async () => {
        const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        setHasPermission(permission.granted);
        return permission.granted;
    };

    const startListening = async () => {
        if (!hasPermission) {
            const granted = await requestPermission();
            if (!granted) {
                setError('Microphone permission not granted');
                return;
            }
        }

        try {
            setError(null);
            setTranscript(''); // Clear previous transcript on new start? Or handle in component.
            await ExpoSpeechRecognitionModule.start({
                lang: 'en-US',
                interimResults: true,
                maxAlternatives: 1,
                // Continuous true means it keeps listening until stop is called or silence timeout
                continuous: false,
                requiresOnDeviceRecognition: false,
                addsPunctuation: true,
            });
        } catch (err) {
            console.error('Failed to start speech recognition:', err);
            setError('Failed to start recording');
            setIsListening(false);
        }
    };

    const stopListening = async () => {
        try {
            await ExpoSpeechRecognitionModule.stop();
            // setIsListening(false) will be handled by 'end' event
        } catch (err) {
            console.error('Failed to stop speech recognition:', err);
        }
    };

    return {
        isListening,
        transcript,
        error,
        hasPermission,
        requestPermission,
        startListening,
        stopListening,
        setTranscript // Export this so we can clear it or modify it if needed
    };
};
