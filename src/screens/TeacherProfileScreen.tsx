import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTeacherProfile } from '../store/slices/coachingSlice';

interface TeacherProfileScreenProps {
    teacherId: number;
    onBack: () => void;
}

const TeacherProfileScreen: React.FC<TeacherProfileScreenProps> = ({ teacherId, onBack }) => {
    const dispatch = useAppDispatch();
    const { teacherProfile, isTeacherLoading, teacherError } = useAppSelector(state => state.coaching);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        dispatch(fetchTeacherProfile(teacherId));
    }, [dispatch, teacherId]);

    // Handle Android hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            onBack();
            return true; // Prevent default behavior (app exit)
        });

        return () => {
            backHandler.remove();
        };
    }, [onBack]);

    const maskPhone = (phone: string) => {
        if (!phone) return 'N*******A';
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 2) return phone;
        const first = cleanPhone[0];
        const last = cleanPhone[cleanPhone.length - 1];
        return `${first}********${last}`;
    };

    const maskEmail = (email: string) => {
        if (!email) return 'N*******A';
        const [user, domain] = email.split('@');
        if (user.length < 2) return `*@${domain}`;
        const first = user[0];
        const last = user[user.length - 1];
        return `${first}********${last}@${domain}`;
    };

    const maskAddress = (address: string) => {
        if (!address) return 'N*******A';
        if (address.length < 2) return address;
        return `${address[0]}********${address[address.length - 1]}`;
    };

    if (isTeacherLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    if (teacherError || !teacherProfile) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{teacherError || 'Teacher not found'}</Text>
                <TouchableOpacity style={styles.backButton} onPress={onBack}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top || 12 }]}>
                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Teacher Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        {teacherProfile.photo ? (
                            <Image source={{ uri: teacherProfile.photo }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Text style={styles.avatarInitial}>
                                    {teacherProfile.name?.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {teacherProfile.average_rating > 0 && (
                            <View style={styles.ratingBadge}>
                                <Ionicons name="star" size={12} color="#ffffff" />
                                <Text style={styles.ratingText}>{teacherProfile.average_rating}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.name}>{teacherProfile.name}</Text>
                    <Text style={styles.qualification}>{teacherProfile.qualification}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{teacherProfile.experience_years}+</Text>
                            <Text style={styles.statLabel}>Exp. Years</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{teacherProfile.ratings?.length || 0}</Text>
                            <Text style={styles.statLabel}>Reviews</Text>
                        </View>
                    </View>
                </View>

                {/* Bio Section */}
                {teacherProfile.bio && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.bioText}>{teacherProfile.bio}</Text>
                    </View>
                )}

                {/* Subjects Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Subjects</Text>
                    <View style={styles.subjectsContainer}>
                        {teacherProfile.subjects?.map((subject: string, index: number) => (
                            <View key={index} style={styles.subjectChip}>
                                <Text style={styles.subjectText}>{subject}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Contact Info (Masked) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.contactCard}>
                        <View style={styles.contactItem}>
                            <Ionicons name="call-outline" size={20} color="#10b981" />
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Phone Number</Text>
                                <Text style={styles.contactValue}>{maskPhone(teacherProfile.phone_number)}</Text>
                            </View>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="mail-outline" size={20} color="#10b981" />
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Email Address</Text>
                                <Text style={styles.contactValue}>{maskEmail(teacherProfile.email)}</Text>
                            </View>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="location-outline" size={20} color="#10b981" />
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Address</Text>
                                <Text style={styles.contactValue}>
                                    {teacherProfile.address ? maskAddress(teacherProfile.address) : (teacherProfile.city ? `${teacherProfile.city}, ${teacherProfile.state}` : 'Address masked')}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.privacyNote}>
                        <Ionicons name="lock-closed-outline" size={14} color="#6b7280" />
                        <Text style={styles.privacyNoteText}>
                            Sensitive details are masked until you enroll or book a session.
                        </Text>
                    </View>
                </View>

                {/* Reviews Section */}
                {teacherProfile.ratings && teacherProfile.ratings.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent Reviews</Text>
                        {teacherProfile.ratings.map((review: any, index: number) => (
                            <View key={index} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <Text style={styles.reviewerName}>{review.user_name}</Text>
                                    <View style={styles.reviewRating}>
                                        <Ionicons name="star" size={14} color="#fbbf24" />
                                        <Text style={styles.reviewRatingText}>{review.rating}</Text>
                                    </View>
                                </View>
                                {review.review_title && (
                                    <Text style={styles.reviewTitle}>{review.review_title}</Text>
                                )}
                                <Text style={styles.reviewContent}>{review.review_content}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#10b981',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    iconButton: {
        padding: 8,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileCard: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#ffffff',
        marginBottom: 12,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    placeholderAvatar: {
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#6b7280',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fbbf24',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#ffffff',
        marginLeft: 2,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    qualification: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 20,
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-evenly',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#10b981',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#e5e7eb',
    },
    section: {
        padding: 16,
        backgroundColor: '#ffffff',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    bioText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 22,
    },
    subjectsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    subjectChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#ecfdf5',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#d1fae5',
    },
    subjectText: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '500',
    },
    contactCard: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        gap: 16,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    privacyNote: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 4,
        gap: 6,
    },
    privacyNoteText: {
        fontSize: 12,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    reviewCard: {
        backgroundColor: '#f9fafb',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    reviewRatingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#d97706',
        marginLeft: 4,
    },
    reviewTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    reviewContent: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
    },
});

export default TeacherProfileScreen;
