import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, Pressable } from 'react-native'
import { fetchUserProfile, UserProfile } from '../../src/client/profile/fetch-profile'

export default function ProfileScreen() {
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let mounted = true
		setLoading(true)
		setError(null)

		// For dev, you can pass userId: 1 if backend doesn't have auth
		fetchUserProfile()
			.then((p) => {
				if (mounted) setProfile(p)
			})
			.catch((err) => {
				if (mounted) setError(err.message || 'Failed to load profile')
			})
			.finally(() => {
				if (mounted) setLoading(false)
			})

		return () => {
			mounted = false
		}
	}, [])

	if (loading) {
		return (
			<View style={[styles.container, styles.center]}>
				<ActivityIndicator size="large" color="#2563eb" />
			</View>
		)
	}

	if (error) {
		return (
			<View style={[styles.container, styles.center]}>
				<Text style={styles.errorText}>{error}</Text>
			</View>
		)
	}

	if (!profile) {
		return (
			<View style={[styles.container, styles.center]}>
				<Text style={styles.subtle}>No profile available</Text>
			</View>
		)
	}

		const avatarSource = profile.avatar_url
			? { uri: profile.avatar_url }
			: { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=10B981&color=fff&size=256` }

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<View style={styles.header}>
				<Image source={avatarSource} style={styles.avatar} />
				<View style={styles.headerText}>
					<Text style={styles.name}>{profile.name}</Text>
					<Text style={styles.email}>{profile.email}</Text>
				</View>
			</View>

			<View style={styles.cardRow}>
				<View style={styles.statCard}>
					<Text style={styles.statNumber}>{profile.num_chats ?? 0}</Text>
					<Text style={styles.statLabel}>Chats</Text>
				</View>
				<View style={styles.statCard}>
					<Text style={styles.statNumber}>{profile.num_lessons ?? 0}</Text>
					<Text style={styles.statLabel}>Lessons</Text>
				</View>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>About</Text>
				<Text style={styles.sectionText}>Grade: {profile.grade_level || '—'}</Text>
				<Text style={styles.sectionText}>Board: {profile.board || '—'}</Text>
				<Text style={styles.sectionText}>Preferred language: {profile.preferred_language || '—'}</Text>
				<Text style={styles.sectionText}>Study goal: {profile.study_goal || '—'}</Text>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Subjects</Text>
				<View style={styles.tagsContainer}>
					{(profile.subjects || []).map((s, i) => (
						<View key={i} style={styles.tag}>
							<Text style={styles.tagText}>{s}</Text>
						</View>
					))}
				</View>
			</View>

			<View style={styles.sectionFooter}>
				<Pressable style={styles.editButton} onPress={() => { /* navigate to edit screen if exists */ }}>
					<Text style={styles.editButtonText}>Edit profile</Text>
				</Pressable>
				<Text style={styles.footerText}>Member since {new Date(profile.created_at).toDateString()}</Text>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	content: {
		padding: 20,
	},
	center: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 18,
	},
	avatar: {
		width: 88,
		height: 88,
		borderRadius: 44,
		backgroundColor: '#f3f4f6',
	},
	headerText: {
		marginLeft: 14,
	},
	name: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
	},
	email: {
		fontSize: 14,
		color: '#6b7280',
		marginTop: 4,
	},
	cardRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 18,
	},
	statCard: {
		flex: 1,
		backgroundColor: '#f9fafb',
		padding: 14,
		borderRadius: 10,
		alignItems: 'center',
		marginHorizontal: 6,
	},
	statNumber: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111827',
	},
	statLabel: {
		fontSize: 12,
		color: '#6b7280',
		marginTop: 4,
	},
	section: {
		backgroundColor: '#ffffff',
		paddingVertical: 10,
		paddingHorizontal: 6,
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 8,
	},
	sectionText: {
		fontSize: 14,
		color: '#374151',
		marginBottom: 4,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	tag: {
		backgroundColor: '#f3f4f6',
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 999,
		marginRight: 8,
		marginBottom: 8,
	},
	tagText: {
		color: '#374151',
		fontSize: 13,
	},
	editButton: {
		backgroundColor: '#2563eb',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	editButtonText: {
		color: '#fff',
		fontWeight: '600',
	},
	sectionFooter: {
		marginTop: 18,
	},
	footerText: {
		marginTop: 10,
		color: '#6b7280',
		fontSize: 13,
		textAlign: 'center',
	},
	errorText: {
		color: '#dc2626',
	},
	subtle: {
		color: '#6b7280',
	},
})
