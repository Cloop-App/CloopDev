import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SUBJECT_LOGOS: { [key: string]: any } = {
    'Mathematics': require('../../assets/subject-logo-png/mathematics.png'),
    'Physics': require('../../assets/subject-logo-png/physics.png'),
    'Science': require('../../assets/subject-logo-png/science.png'),
    'Chemistry': require('../../assets/subject-logo-png/chemistry.png'),
    'Biology': require('../../assets/subject-logo-png/biology.png'),
    'History': require('../../assets/subject-logo-png/history.png'),
    'Geography': require('../../assets/subject-logo-png/geography.png'),
    'English': require('../../assets/subject-logo-png/english.png'),
    'Economics': require('../../assets/subject-logo-png/economics.png'),
    'Fine Art': require('../../assets/subject-logo-png/art and craft.png'),
    'Art & Craft': require('../../assets/subject-logo-png/art and craft.png'),
    'Social Science': require('../../assets/subject-logo-png/history.png'),
    'Social Studies': require('../../assets/subject-logo-png/history.png'),
    'Computer': require('../../assets/subject-logo-png/computer.png'),
    'Computer Science': require('../../assets/subject-logo-png/computer.png'),
    'Robotics': require('../../assets/subject-logo-png/robotics.png'),
    'Civics': require('../../assets/subject-logo-png/civics.png'),
    'Music': require('../../assets/subject-logo-png/music.png'),
    'Algebra': require('../../assets/subject-logo-png/algebra.png'),
    'Business Studies': require('../../assets/subject-logo-png/business study.png'),
    'Sociology': require('../../assets/subject-logo-png/sociology.png'),
    'Physical Education': require('../../assets/subject-logo-png/physical education or sports.png'),
    'Data Science': require('../../assets/subject-logo-png/data science.png'),
    'Geometry': require('../../assets/subject-logo-png/geometry.png'),
    'Agriculture': require('../../assets/subject-logo-png/agriculture.png'),
    'Vocational Education': require('../../assets/subject-logo-png/vocational education.png'),
    'Tourism': require('../../assets/subject-logo-png/tourism and hospitality.png'),
    'Value Education': require('../../assets/subject-logo-png/value education.png'),
    'Performing Arts': require('../../assets/subject-logo-png/performing arts.png'),
    'Hindi': require('../../assets/subject-logo-png/languages.png'),
    'Environmental Studies': require('../../assets/subject-logo-png/evs.png'),
};

interface SubjectIconProps {
    subject: string;
    size?: number;
}

export const SubjectIcon: React.FC<SubjectIconProps> = ({ subject, size = 40 }) => {
    const getSubjectIcon = (subjectName: string): any => {
        const icons: { [key: string]: any } = {
            'Mathematics': 'calculator',
            'Physics': 'flask',
            'Chemistry': 'flask',
            'Biology': 'flower',
            'History': 'book',
            'Geography': 'globe',
            'English': 'book',
            'Hindi': 'language',
            'Literature': 'book',
            'Fine Art': 'brush',
            'Economics': 'stats-chart',
        };
        return icons[subjectName] || 'book';
    };

    const getSubjectIconColor = (subjectName: string): string => {
        const colors: { [key: string]: string } = {
            'Mathematics': '#4CAF50',
            'Physics': '#2196F3',
            'Chemistry': '#FF9800',
            'Biology': '#9C27B0',
            'History': '#FF5722',
            'Geography': '#009688',
            'English': '#E91E63',
            'Hindi': '#FBC02D',
            'Literature': '#F44336',
            'Fine Art': '#FF9800',
            'Economics': '#FFE0B2',
        };
        return colors[subjectName] || '#8B5CF6';
    };

    if (SUBJECT_LOGOS[subject]) {
        return (
            <Image
                source={SUBJECT_LOGOS[subject]}
                style={{ width: size, height: size }}
                resizeMode="contain"
            />
        );
    }

    return (
        <Ionicons
            name={getSubjectIcon(subject)}
            size={size * 0.8} // Scale icon slightly smaller than container
            color={getSubjectIconColor(subject)}
        />
    );
};
