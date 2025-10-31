import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, Pressable, Modal, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { fetchUserProfile, UserProfile } from '../../src/client/profile/fetch-profile'
import { useAuth } from '../../src/context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { fetchAllSubjects, addUserSubject, removeUserSubject, getAvailableSubjects, Subject, UserSubjectResponse } from '../../src/client/profile/subjects'

export default function ProfileScreen() {
	const router = useRouter()
	const { isAuthenticated, user, token, logout } = useAuth()
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showAddSubject, setShowAddSubject] = useState(false)
	const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
	const [loadingSubjects, setLoadingSubjects] = useState(false)
	const [actionLoading, setActionLoading] = useState<number | null>(null)

	// Dedicated logout handler
	const handleLogout = async () => {
		console.log('🔓 Logout initiated...')
		
		try {
			// Call the logout function from AuthContext
			await logout()
			console.log('✅ Logout successful, auth state cleared')
		} catch (error) {
			console.error('❌ Logout error:', error)
			// Continue with navigation even if logout fails
		}

		// Always navigate to login regardless of logout success/failure
		console.log('🧭 Navigating to login screen...')
		
		try {
			// Try different navigation methods for better reliability
			router.replace('/login-sigup/login')
		} catch (navError) {
			console.error('❌ Navigation error with replace, trying push:', navError)
			try {
				router.push('/login-sigup/login')
			} catch (pushError) {
				console.error('❌ Navigation error with push:', pushError)
				// Last resort - refresh the page (for web) or force navigation
				if (typeof window !== 'undefined') {
					window.location.href = '/login-sigup/login'
				}
			}
		}
	}

	useEffect(() => {
		console.log('🔍 Auth state changed:', { isAuthenticated, user: user?.email })
		if (!isAuthenticated) {
			console.log('🚪 User not authenticated, redirecting to login...')
			router.replace('/login-sigup/login')
			return
		}
	}, [isAuthenticated, router, user])

	useEffect(() => {
		console.log('📊 Profile loading effect triggered:', { 
			isAuthenticated, 
			hasUser: !!user, 
			hasToken: !!token 
		})
		
		if (!isAuthenticated || !user) {
			console.log('⏭️ Skipping profile load - not authenticated or no user')
			return
		}

		let mounted = true
		setLoading(true)
		setError(null)

		console.log('🔄 Fetching user profile for:', user.email)
		
		// Use the authenticated user's ID and token
		fetchUserProfile({ 
			userId: user.user_id, 
			token: token || undefined 
		})
			.then((p) => {
				if (mounted) {
					console.log('✅ Profile loaded successfully:', p.name)
					setProfile(p)
				}
			})
			.catch((err) => {
				console.error('❌ Profile load error:', err)
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
		<View style={styles.container}>
			{/* Header with back and logout buttons */}
			<View style={styles.topHeader}>
				<Pressable 
					style={styles.headerButton}
					onPress={() => router.back()}
				>
					<Ionicons name="arrow-back" size={24} color="#111827" />
				</Pressable>
				<Text style={styles.headerTitle}>Profile</Text>
				<Pressable 
					style={styles.logoutButton}
					onPress={() => {
						Alert.alert(
							'Logout',
							'Are you sure you want to logout?',
							[
								{ text: 'Cancel', style: 'cancel' },
								{ 
									text: 'Logout', 
									style: 'destructive',
									onPress: async () => {
										try {
											await logout()
											router.replace('/login-sigup/login')
										} catch (error) {
											console.error('Header logout error:', error)
											// Force logout even if there's an error
											router.replace('/login-sigup/login')
										}
									}
								}
							]
						)
					}}
				>
					<Ionicons name="log-out-outline" size={24} color="#ef4444" />
				</Pressable>
			</View>

			<ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
				<View style={styles.profileHeader}>
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
						<Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
						<Text style={styles.editButtonText}>Edit Profile</Text>
					</Pressable>
					
					<Pressable 
						style={styles.logoutButtonMain} 
						onPress={() => {
							Alert.alert(
								'Logout',
								'Are you sure you want to logout?',
								[
									{ text: 'Cancel', style: 'cancel' },
									{ 
										text: 'Logout', 
										style: 'destructive',
										onPress: async () => {
											try {
												await logout()
												router.replace('/login-sigup/login')
											} catch (error) {
												console.error('Main logout error:', error)
												// Force logout even if there's an error
												router.replace('/login-sigup/login')
											}
										}
									}
								]
							)
						}}
					>
						<Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
						<Text style={styles.logoutButtonMainText}>Logout</Text>
					</Pressable>
					
					<Text style={styles.footerText}>Member since {new Date(profile.created_at).toDateString()}</Text>
				</View>
			</ScrollView>

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
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f8fafc',
	},
	topHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingTop: 60,
		paddingBottom: 20,
		backgroundColor: '#ffffff',
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	headerButton: {
		padding: 8,
		borderRadius: 8,
		backgroundColor: '#f3f4f6',
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
	},
	logoutButton: {
		padding: 8,
		borderRadius: 8,
		backgroundColor: '#fef2f2',
	},
	scrollContainer: {
		flex: 1,
	},
	content: {
		padding: 20,
		paddingBottom: 40,
	},
	center: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	profileHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 24,
		backgroundColor: '#ffffff',
		padding: 20,
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 3,
	},
	avatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#f3f4f6',
		borderWidth: 4,
		borderColor: '#ffffff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 12,
		elevation: 4,
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
		marginBottom: 24,
		gap: 12,
	},
	statCard: {
		flex: 1,
		backgroundColor: '#ffffff',
		padding: 20,
		borderRadius: 16,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 3,
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
		padding: 20,
		borderRadius: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 3,
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
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 12,
		shadowColor: '#2563eb',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	editButtonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 16,
	},
	sectionFooter: {
		marginTop: 18,
		gap: 12,
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
		backgroundColor: '#f8fafc',
		padding: 16,
		borderRadius: 12,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderColor: '#e2e8f0',
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
		borderRadius: 20,
		width: '90%',
		maxHeight: '80%',
		padding: 0,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.25,
		shadowRadius: 20,
		elevation: 10,
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
	logoutButtonMain: {
		backgroundColor: '#ef4444',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 12,
		marginTop: 8,
		shadowColor: '#ef4444',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 4,
	},
	logoutButtonMainText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 16,
	},
})
