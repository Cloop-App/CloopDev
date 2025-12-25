import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, Pressable, Modal, Alert, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { fetchUserProfile, UserProfile } from '../../src/client/profile/fetch-profile'
import { useAuth } from '../../src/context/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { fetchAllSubjects, addUserSubject, removeUserSubject, getAvailableSubjects, Subject, UserSubjectResponse } from '../../src/client/profile/subjects'
import { THEME } from '../../src/constants/theme'
import { BottomNavigation } from '../../components/navigation/BottomNavigation'

export default function ProfileScreen() {
	const router = useRouter()
	const insets = useSafeAreaInsets()
	const { isAuthenticated, user, token, logout } = useAuth()
	const [profile, setProfile] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showAddSubject, setShowAddSubject] = useState(false)
	const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
	const [loadingSubjects, setLoadingSubjects] = useState(false)
	const [actionLoading, setActionLoading] = useState<number | null>(null)

	const handleTabPress = (tabId: string) => {
		switch (tabId) {
			case 'home':
				router.push('/home/home')
				break
			case 'session':
				router.push('/chapter-topic/session' as any)
				break
			case 'statistics':
				router.push('/metrices/home' as any)
				break
			case 'profile':
				// Already here
				break
		}
	}

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
			const available = await getAvailableSubjects(profile.user_subjects as any, {
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
				<ActivityIndicator size="large" color={THEME.colors.primary} />
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
		: { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=EF4444&color=fff&size=256` }

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + 10 }]}>
				<Pressable
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Ionicons name="arrow-back" size={24} color="#FFFFFF" />
				</Pressable>
				<Text style={styles.headerTitle}>My Profile</Text>
				<Pressable style={styles.menuButton} onPress={() => router.push('/notifications/notifications' as any)}>
					<Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
				</Pressable>
			</View>

			<ScrollView
				style={styles.scrollContainer}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Profile Info Card */}
				<View style={styles.profileCard}>
					<View style={styles.avatarContainer}>
						<Image source={avatarSource} style={styles.avatar} />
						<View style={styles.editBadge}>
							<Ionicons name="camera" size={12} color="#FFFFFF" />
						</View>
					</View>
					<Text style={styles.userName}>{profile.name} <Ionicons name="pencil" size={16} color="#9CA3AF" /></Text>
					<Text style={styles.userInfo}>Class {profile.grade_level || '5'} | {profile.board || 'CBSE'}</Text>
				</View>

				{/* General Settings Section */}
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Settings</Text>

					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
					>
						<View style={styles.menuItemLeft}>
							<View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
								<Ionicons name="notifications-outline" size={20} color="#8B5CF6" />
							</View>
							<Text style={styles.menuItemText}>Learning Reminder</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
					</Pressable>

					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
						onPress={() => router.push('/metrices/home' as any)}
					>
						<View style={styles.menuItemLeft}>
							<View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
								<Ionicons name="trophy-outline" size={20} color="#8B5CF6" />
							</View>
							<Text style={styles.menuItemText}>Achievements</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
					</Pressable>

					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
						onPress={() => router.push('/chapter-topic/session' as any)}
					>
						<View style={styles.menuItemLeft}>
							<View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
								<Ionicons name="bookmark-outline" size={20} color="#8B5CF6" />
							</View>
							<Text style={styles.menuItemText}>Saved Topics</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
					</Pressable>

					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
					>
						<View style={styles.menuItemLeft}>
							<View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
								<Ionicons name="settings-outline" size={20} color="#8B5CF6" />
							</View>
							<Text style={styles.menuItemText}>Preferences</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
					</Pressable>
				</View>

				{/* Security & Privacy Section */}
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Security & Privacy</Text>

					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
					>
						<View style={styles.menuItemLeft}>
							<View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
								<Ionicons name="shield-checkmark-outline" size={20} color="#0EA5E9" />
							</View>
							<Text style={styles.menuItemText}>Security</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
					</Pressable>

					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
					>
						<View style={styles.menuItemLeft}>
							<View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
								<Ionicons name="help-circle-outline" size={20} color="#0EA5E9" />
							</View>
							<Text style={styles.menuItemText}>Help Center</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
					</Pressable>

					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
					>
						<View style={styles.menuItemLeft}>
							<View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
								<Ionicons name="information-circle-outline" size={20} color="#0EA5E9" />
							</View>
							<Text style={styles.menuItemText}>About Us</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
					</Pressable>
				</View>

				{/* Log Out Section */}
				<View style={styles.section}>
					<Text style={styles.sectionHeader}>Account</Text>

					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
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
												console.error('Logout error:', error)
												router.replace('/login-sigup/login')
											}
										}
									}
								]
							)
						}}
					>
						<View style={styles.menuItemLeft}>
							<View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
								<Ionicons name="log-out-outline" size={20} color="#EF4444" />
							</View>
							<Text style={[styles.menuItemText, { color: '#EF4444' }]}>Log out</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#Ef4444" />
					</Pressable>

					<Pressable
						style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
					>
						<View style={styles.menuItemLeft}>
							<View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
								<Ionicons name="trash-outline" size={20} color="#EF4444" />
							</View>
							<Text style={[styles.menuItemText, { color: '#EF4444' }]}>Delete Account</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color="#EF4444" />
					</Pressable>
				</View>
			</ScrollView>

			<BottomNavigation
				activeTab="profile"
				onTabPress={handleTabPress}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F8FAFC',
	},
	header: {
		backgroundColor: '#8B5CF6',
		paddingHorizontal: 20,
		paddingBottom: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		shadowColor: '#8B5CF6',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 8,
		zIndex: 10,
	},
	backButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.2)',
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#FFFFFF',
		flex: 1,
		textAlign: 'center',
		marginRight: 40,
	},
	menuButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
		backgroundColor: 'rgba(255,255,255,0.2)',
	},
	scrollContainer: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 120, // Space for Bottom Navigation
	},
	profileCard: {
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		paddingVertical: 24,
		marginHorizontal: 20,
		marginTop: 20,
		marginBottom: 20,
		borderRadius: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 4,
	},
	avatarContainer: {
		position: 'relative',
		marginBottom: 16,
	},
	avatar: {
		width: 90,
		height: 90,
		borderRadius: 45,
		borderWidth: 4,
		borderColor: '#F3E8FF',
	},
	editBadge: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		backgroundColor: '#8B5CF6',
		width: 28,
		height: 28,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: '#FFFFFF',
	},
	userName: {
		fontSize: 20,
		fontWeight: '700',
		color: '#1F2937',
		marginBottom: 6,
		flexDirection: 'row',
		alignItems: 'center',
	},
	userInfo: {
		fontSize: 14,
		color: '#6B7280',
		backgroundColor: '#F3F4F6',
		paddingHorizontal: 12,
		paddingVertical: 4,
		borderRadius: 12,
		overflow: 'hidden',
	},
	section: {
		backgroundColor: '#FFFFFF',
		marginHorizontal: 20,
		marginBottom: 16,
		borderRadius: 20,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.03,
		shadowRadius: 6,
		elevation: 2,
	},
	sectionHeader: {
		fontSize: 13,
		fontWeight: '700',
		color: '#9CA3AF',
		marginBottom: 16,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginLeft: 4,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
		paddingHorizontal: 8,
		borderRadius: 12,
		marginBottom: 4,
	},
	menuItemPressed: {
		backgroundColor: '#F9FAFB',
	},
	menuItemLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	iconContainer: {
		width: 36,
		height: 36,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 14,
	},
	menuItemText: {
		fontSize: 15,
		fontWeight: '500',
		color: '#1F2937',
	},
	center: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorText: {
		color: THEME.colors.primary,
	},
	subtle: {
		color: THEME.colors.text.secondary,
	},
})
