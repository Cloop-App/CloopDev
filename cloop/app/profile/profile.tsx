import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, Pressable, Modal, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { fetchUserProfile, UserProfile } from '../../src/client/profile/fetch-profile'
import { useAuth } from '../../src/context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { fetchAllSubjects, addUserSubject, removeUserSubject, getAvailableSubjects, Subject, UserSubjectResponse } from '../../src/client/profile/subjects'

export default function ProfileScreen() {
	const router = useRouter()
	const { isAuthenticated, user, token } = useAuth()
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showAddSubject, setShowAddSubject] = useState(false)
	const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
	const [loadingSubjects, setLoadingSubjects] = useState(false)
	const [actionLoading, setActionLoading] = useState<number | null>(null)

	useEffect(() => {
		if (!isAuthenticated) {
			router.replace('/login-sigup/login')
			return
		}
	}, [isAuthenticated, router])

	useEffect(() => {
		if (!isAuthenticated || !user) return

		let mounted = true
		setLoading(true)
		setError(null)

		// Use the authenticated user's ID and token
		fetchUserProfile({ 
			userId: user.user_id, 
			token: token || undefined 
		})
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
	}, [isAuthenticated, user, token])

	const loadAvailableSubjects = async () => {
		if (!profile?.user_subjects) return
		
		setLoadingSubjects(true)
		try {
			const available = await getAvailableSubjects(profile.user_subjects, {
				token: token || undefined
			})
			setAvailableSubjects(available)
		} catch (err) {
			console.error('Error loading available subjects:', err)
			Alert.alert('Error', 'Failed to load available subjects')
		} finally {
			setLoadingSubjects(false)
		}
	}

	const handleAddSubject = async (subjectId: number) => {
		setActionLoading(subjectId)
		try {
			await addUserSubject(subjectId, {
				userId: user?.user_id,
				token: token || undefined
			})
			
			// Refresh profile to get updated subjects
			const updatedProfile = await fetchUserProfile({ 
				userId: user?.user_id, 
				token: token || undefined 
			})
			setProfile(updatedProfile)
			
			// Close modal and refresh available subjects
			setShowAddSubject(false)
			Alert.alert('Success', 'Subject added successfully!')
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to add subject'
			Alert.alert('Error', errorMessage)
		} finally {
			setActionLoading(null)
		}
	}

	const handleRemoveSubject = async (subjectId: number, subjectName: string) => {
		Alert.alert(
			'Remove Subject',
			`Are you sure you want to remove ${subjectName} from your profile?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{ 
					text: 'Remove', 
					style: 'destructive',
					onPress: async () => {
						setActionLoading(subjectId)
						try {
							await removeUserSubject(subjectId, {
								userId: user?.user_id,
								token: token || undefined
							})
							
							// Refresh profile to get updated subjects
							const updatedProfile = await fetchUserProfile({ 
								userId: user?.user_id, 
								token: token || undefined 
							})
							setProfile(updatedProfile)
							
							Alert.alert('Success', 'Subject removed successfully!')
						} catch (err) {
							const errorMessage = err instanceof Error ? err.message : 'Failed to remove subject'
							Alert.alert('Error', errorMessage)
						} finally {
							setActionLoading(null)
						}
					}
				}
			]
		)
	}

	// Show loading or redirect if not authenticated
	if (!isAuthenticated) {
		return (
			<View style={[styles.container, styles.center]}>
				<Text>Redirecting to login...</Text>
			</View>
		)
	}

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
				<View style={styles.sectionHeader}>
					<Text style={styles.sectionTitle}>Your Subjects</Text>
					<Pressable 
						style={styles.addButton}
						onPress={() => {
							setShowAddSubject(true)
							loadAvailableSubjects()
						}}
					>
						<Ionicons name="add" size={20} color="#fff" />
						<Text style={styles.addButtonText}>Add Subject</Text>
					</Pressable>
				</View>
				
				{/* Current Subjects */}
				<View style={styles.subjectsContainer}>
					{profile.user_subjects && profile.user_subjects.length > 0 ? (
						profile.user_subjects.map((userSubject, i) => (
							<View key={i} style={styles.subjectCard}>
								<View style={styles.subjectInfo}>
									<Text style={styles.subjectName}>{userSubject.subject.name}</Text>
									<Text style={styles.subjectProgress}>
										{userSubject.completed_chapters}/{userSubject.total_chapters} chapters • {userSubject.completion_percent}% complete
									</Text>
								</View>
								<Pressable 
									style={styles.removeButton}
									onPress={() => handleRemoveSubject(userSubject.subject_id, userSubject.subject.name)}
									disabled={actionLoading === userSubject.subject_id}
								>
									{actionLoading === userSubject.subject_id ? (
										<ActivityIndicator size="small" color="#ef4444" />
									) : (
										<Ionicons name="remove-circle" size={24} color="#ef4444" />
									)}
								</Pressable>
							</View>
						))
					) : profile.subjects && profile.subjects.length > 0 ? (
						// Fallback to old subjects array
						profile.subjects.map((s, i) => (
							<View key={i} style={styles.tag}>
								<Text style={styles.tagText}>{s}</Text>
							</View>
						))
					) : (
						<Text style={styles.noSubjectsText}>No subjects selected yet</Text>
					)}
				</View>
			</View>

			<View style={styles.sectionFooter}>
				<Pressable style={styles.editButton} onPress={() => { /* navigate to edit screen if exists */ }}>
					<Text style={styles.editButtonText}>Edit profile</Text>
				</Pressable>
				<Text style={styles.footerText}>Member since {new Date(profile.created_at).toDateString()}</Text>
			</View>

			{/* Add Subject Modal */}
			<Modal
				visible={showAddSubject}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setShowAddSubject(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Add New Subject</Text>
							<Pressable onPress={() => setShowAddSubject(false)}>
								<Ionicons name="close" size={24} color="#666" />
							</Pressable>
						</View>
						
						<ScrollView style={styles.modalScroll}>
							{loadingSubjects ? (
								<View style={styles.modalLoading}>
									<ActivityIndicator size="large" color="#2563eb" />
									<Text style={styles.modalLoadingText}>Loading available subjects...</Text>
								</View>
							) : availableSubjects.length > 0 ? (
								availableSubjects.map((subject) => (
									<Pressable 
										key={subject.id} 
										style={styles.subjectOption}
										onPress={() => handleAddSubject(subject.id)}
										disabled={actionLoading === subject.id}
									>
										<View style={styles.subjectOptionInfo}>
											<Text style={styles.subjectOptionName}>{subject.name}</Text>
											{subject.category && (
												<Text style={styles.subjectOptionCategory}>{subject.category}</Text>
											)}
										</View>
										{actionLoading === subject.id ? (
											<ActivityIndicator size="small" color="#2563eb" />
										) : (
											<Ionicons name="add-circle" size={24} color="#10B981" />
										)}
									</Pressable>
								))
							) : (
								<Text style={styles.noAvailableSubjects}>All available subjects have been added to your profile!</Text>
							)}
						</ScrollView>
					</View>
				</View>
			</Modal>
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
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	addButton: {
		backgroundColor: '#10B981',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	addButtonText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
		marginLeft: 4,
	},
	subjectsContainer: {
		gap: 8,
	},
	subjectCard: {
		backgroundColor: '#f9fafb',
		padding: 12,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	subjectInfo: {
		flex: 1,
	},
	subjectName: {
		fontSize: 14,
		fontWeight: '600',
		color: '#111827',
	},
	subjectProgress: {
		fontSize: 12,
		color: '#6b7280',
		marginTop: 2,
	},
	removeButton: {
		padding: 4,
	},
	noSubjectsText: {
		fontSize: 14,
		color: '#6b7280',
		fontStyle: 'italic',
		textAlign: 'center',
		marginTop: 8,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: '#fff',
		borderRadius: 12,
		width: '90%',
		maxHeight: '80%',
		padding: 0,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#111827',
	},
	modalScroll: {
		maxHeight: 400,
	},
	modalLoading: {
		padding: 40,
		alignItems: 'center',
	},
	modalLoadingText: {
		marginTop: 12,
		color: '#6b7280',
	},
	subjectOption: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#f3f4f6',
	},
	subjectOptionInfo: {
		flex: 1,
	},
	subjectOptionName: {
		fontSize: 16,
		fontWeight: '500',
		color: '#111827',
	},
	subjectOptionCategory: {
		fontSize: 12,
		color: '#6b7280',
		marginTop: 2,
	},
	noAvailableSubjects: {
		padding: 40,
		textAlign: 'center',
		color: '#6b7280',
		fontSize: 14,
	},
})
