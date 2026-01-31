import { useState, useEffect, useCallback } from 'react';

// Define SpeechRecognition types as they might not be in standard TS lib
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}


export function useVoiceInput() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' &&
            (window.SpeechRecognition || (window as any).webkitSpeechRecognition)) {
            setSupported(true);
        }
    }, []);

    const startListening = useCallback(() => {
        if (!supported) {
            setError("Speech recognition not supported in this browser");
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.continuous = false; // Stop after one sentence
            recognition.interimResults = false;
            recognition.lang = 'en-IN'; // Indian English for better Hinglish support

            recognition.onstart = () => {
                setIsListening(true);
                setError(null);
            };

            recognition.onresult = (event: SpeechRecognitionEvent) => {
                const lastResult = event.results[event.results.length - 1];
                if (lastResult.isFinal) {
                    const text = lastResult[0].transcript;
                    setTranscript(text);
                    setIsListening(false);
                }
            };

            recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error("Speech recognition error", event.error);
                setError(`Error: ${event.error}`);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.start();
        } catch (err) {
            console.error("Failed to start speech recognition", err);
            setError("Failed to start microphone");
            setIsListening(false);
        }
    }, [supported]);

    const stopListening = useCallback(() => {
        // In simple mode, it stops automatically, but we can force stop if needed
        setIsListening(false);
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        setError(null);
    }, []);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        resetTranscript,
        supported
    };
}
