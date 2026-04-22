import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService, categoryService } from '../services/api';
import { HamburgerMenu } from '../components/hamburger-menu';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

// Steps:
// 0 - Landing
// 1 - Social + Email
// 2 - Password (+ Name if signup)
// 3 - Welcome + voting explainer
// 4 - Category selection
type Step = 0 | 1 | 2 | 3 | 4;

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function IndexScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  useEffect(() => {
    categoryService.getAll()
      .then(r => setCategories(r.data))
      .catch(e => console.error('Failed to load categories', e));
  }, []);

  const goTo = (s: Step) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(s);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      const { access_token, user } = response.data;
      await authService.saveToken(access_token);
      setName(user.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await authService.register({ name, email, password });
      const { access_token } = response.data;
      await authService.saveToken(access_token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      goTo(3);
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.response?.data?.message || `Network Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCategory = (cat: Category | null) => {
    setSelectedCategory(cat);
    setIsPickerVisible(false);
  };

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Landing ──────────────────────────────────────────────
      case 0:
        return (
          <Animated.View key="step0" entering={FadeIn} exiting={FadeOut} style={styles.stepContainer}>
            <Text style={styles.heroTitle}>Like it or not?</Text>
            <Text style={styles.heroSubtitle}>Give your opinion on...</Text>

            <View style={styles.gridContainer}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View key={i} style={styles.gridItem}>
                  <View style={styles.gridPlaceholder}>
                    <View style={styles.diagonal1} />
                    <View style={styles.diagonal2} />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => { setIsLoginMode(false); goTo(1); }}
              >
                <Text style={styles.primaryButtonText}>Sign up for free</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => { setIsLoginMode(true); goTo(1); }}
              >
                <Text style={styles.secondaryButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      // ── Step 1: Social + Email ────────────────────────────────────────
      case 1:
        return (
          <Animated.View key="step1" entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
            <TouchableOpacity onPress={() => goTo(0)} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#1C1C1E" />
            </TouchableOpacity>

            <Text style={styles.heroTitle}>Like it or not?</Text>

            <View style={styles.socialGroup}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Alert.alert('Coming Soon', 'Google sign-in coming soon.')}
              >
                <View style={styles.socialIcon}><Text style={styles.socialIconText}>G</Text></View>
                <Text style={styles.socialButtonText}>Sign up with Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Alert.alert('Coming Soon', 'Facebook sign-in coming soon.')}
              >
                <View style={[styles.socialIcon, { backgroundColor: '#1877F2' }]}>
                  <Text style={[styles.socialIconText, { color: '#FFF' }]}>f</Text>
                </View>
                <Text style={styles.socialButtonText}>Sign up with Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => Alert.alert('Coming Soon', 'Apple sign-in coming soon.')}
              >
                <View style={[styles.socialIcon, { backgroundColor: '#000' }]}>
                  <Text style={[styles.socialIconText, { color: '#FFF' }]}></Text>
                </View>
                <Text style={styles.socialButtonText}>Sign up with Apple</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>or</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.rowButtons}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]}
                onPress={() => { setIsLoginMode(true); goTo(2); }}
              >
                <Text style={styles.secondaryButtonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, marginLeft: 8 }]}
                onPress={() => { setIsLoginMode(false); goTo(2); }}
              >
                <Text style={styles.primaryButtonText}>Next &gt;</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.disclaimer}>
              By signing in or creating an account you agree to our Terms of Service and Privacy Policy.
            </Text>
          </Animated.View>
        );

      // ── Step 2: Credentials ───────────────────────────────────────────
      case 2:
        return (
          <Animated.View key="step2" entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
            <TouchableOpacity onPress={() => goTo(1)} style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="#1C1C1E" />
            </TouchableOpacity>

            <Text style={styles.heroTitle}>{isLoginMode ? 'Welcome Back' : 'Create Account'}</Text>

            {!isLoginMode && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Smith"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder={isLoginMode ? 'Your password' : 'Minimum 8 characters'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && { opacity: 0.5 }]}
              onPress={isLoginMode ? handleLogin : handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading
                  ? (isLoginMode ? 'Logging in...' : 'Creating account...')
                  : (isLoginMode ? 'Login >' : 'Next >')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 12 }]}
              onPress={() => { setIsLoginMode(!isLoginMode); setPassword(''); }}
            >
              <Text style={styles.secondaryButtonText}>
                {isLoginMode ? 'Create an account instead' : 'I already have an account'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      // ── Step 3: Welcome + voting explainer ───────────────────────────
      case 3:
        return (
          <Animated.View key="step3" entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
            <Text style={styles.heroTitle}>Welcome, {name.split(' ')[0]}!</Text>
            <Text style={styles.bodyText}>
              This is super simple...{"\n"}We present you with something, and you vote:
            </Text>

            <View style={styles.voteOptions}>
              <View style={styles.voteOption}>
                <IconSymbol name="face.smiling" size={40} color="#1C1C1E" />
                <Text style={styles.voteText}>I like it</Text>
              </View>
              <View style={styles.voteOption}>
                <IconSymbol name="face.smiling.inverse" size={40} color="#1C1C1E" />
                <Text style={styles.voteText}>I don't like it</Text>
              </View>
              <View style={styles.voteOption}>
                <IconSymbol name="face.dashed" size={40} color="#1C1C1E" />
                <Text style={styles.voteText}>I don't know it or I'm neutral</Text>
              </View>
            </View>

            <Text style={styles.footerTextSmall}>
              We'll show you how everyone voted, and then you keep voting.
            </Text>

            <TouchableOpacity style={[styles.primaryButton, { marginTop: 32 }]} onPress={() => goTo(4)}>
              <Text style={styles.primaryButtonText}>Next &gt;</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      // ── Step 4: Category selection ────────────────────────────────────
      case 4:
        return (
          <Animated.View key="step4" entering={SlideInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.headerBrand}>Like It{"\n"}Or Not?</Text>
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  style={styles.categoryPill}
                  onPress={() => setIsPickerVisible(true)}
                >
                  <Text style={styles.categoryPillText}>{selectedCategory ? selectedCategory.name : 'Anything'}</Text>
                  <IconSymbol name="chevron.down" size={14} color="#FFF" />
                </TouchableOpacity>
                <IconSymbol name="trophy" size={24} color="#FFF" />
                <HamburgerMenu />
              </View>
            </View>

            <View style={styles.centeredContent}>
              <Text style={styles.onboardingText}>
                Choose a category to vote in... or go with "Anything" to have a completely random fun time!
              </Text>

              <TouchableOpacity style={styles.startVotingButton} onPress={() => router.replace('/(tabs)')}>
                <Text style={styles.startVotingText}>START VOTING &gt;</Text>
              </TouchableOpacity>

              <View style={styles.coachTip}>
                <Text style={styles.coachText}>
                  Your Coach will drop knowledge, give you tips, share statistics, and cheer you on.
                </Text>
                <View style={styles.coachPointer}>
                  <IconSymbol name="arrow.down" size={24} color="#1C1C1E" />
                </View>
              </View>
            </View>

            <View style={styles.bottomBanner}>
              <IconSymbol name="megaphone.fill" size={16} color="#FFF" />
              <Text style={styles.bannerText}>
                You're one screen away from your first vote.{"\n"}
                It could literally be a vote on anything in the world...
              </Text>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={isPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsPickerVisible(false)}
        >
          <View style={styles.pickerModal}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity
              style={[styles.categoryItem, selectedCategory === null && styles.categoryItemActive]}
              onPress={() => selectCategory(null)}
            >
              <Text style={[styles.categoryItemText, selectedCategory === null && styles.categoryItemTextActive]}>
                Anything
              </Text>
              {selectedCategory === null && <IconSymbol name="checkmark" size={18} color="#FFF" />}
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryItem, selectedCategory?.id === cat.id && styles.categoryItemActive]}
                onPress={() => selectCategory(cat)}
              >
                <Text style={[styles.categoryItemText, selectedCategory?.id === cat.id && styles.categoryItemTextActive]}>
                  {cat.name}
                </Text>
                {selectedCategory?.id === cat.id && <IconSymbol name="checkmark" size={18} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginLeft: -8,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
    marginVertical: 24,
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  gridItem: {
    width: (width - 48 - 24) / 3,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
  },
  gridPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagonal1: {
    position: 'absolute',
    width: '141%',
    height: 2,
    backgroundColor: '#1C1C1E',
    transform: [{ rotate: '45deg' }],
  },
  diagonal2: {
    position: 'absolute',
    width: '141%',
    height: 2,
    backgroundColor: '#1C1C1E',
    transform: [{ rotate: '-45deg' }],
  },
  buttonGroup: {
    gap: 16,
  },
  primaryButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },
  primaryButtonText: {
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 18,
    fontWeight: '700',
  },
  socialGroup: {
    gap: 12,
    marginBottom: 8,
  },
  socialButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    gap: 12,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  socialButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#1C1C1E',
  },
  separatorText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 17,
  },
  rowButtons: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  disclaimer: {
    fontSize: 13,
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 18,
    color: '#1C1C1E',
    marginBottom: 32,
    lineHeight: 26,
    fontWeight: '500',
  },
  voteOptions: {
    gap: 28,
    marginBottom: 32,
  },
  voteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  voteText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  footerTextSmall: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    lineHeight: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000',
    marginHorizontal: -24,
    marginTop: -12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 32,
  },
  headerBrand: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  categoryPillText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  centeredContent: {
    alignItems: 'center',
    flex: 1,
  },
  onboardingText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  startVotingButton: {
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginBottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  startVotingText: {
    fontSize: 24,
    fontWeight: '900',
  },
  coachTip: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  coachText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  coachPointer: {
    marginTop: 8,
  },
  bottomBanner: {
    backgroundColor: '#000',
    marginHorizontal: -24,
    marginBottom: -40,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerModal: {
    width: '100%',
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryItem: {
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  categoryItemActive: {
    backgroundColor: '#1C1C1E',
  },
  categoryItemText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  categoryItemTextActive: {
    color: '#FFF',
  },
});
