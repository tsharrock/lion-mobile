import React, { useState, useEffect, useCallback } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { categoryService, postService, voteService } from '../../services/api';
import { STORAGE_URL } from '../../constants/api';
import { HamburgerMenu } from '../../components/hamburger-menu';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Post {
  id: number;
  title: string;
  description: string;
  image_path: string;
  category: Category;
  yes_votes: number;
  no_votes: number;
  neutral_votes: number;
}

export default function VoteScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [voteCount, setVoteCount] = useState(27);

  useEffect(() => {
    loadCategories();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [selectedCategory])
  );

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await postService.getAll(selectedCategory?.id);
      setPosts(response.data);
      setCurrentPostIndex(0);
      setHasVoted(false);
    } catch (error) {
      console.error('Failed to load posts', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  const handleVote = async (type: 'yes' | 'no' | 'neutral') => {
    if (!posts[currentPostIndex]) return;

    try {
      await voteService.vote(posts[currentPostIndex].id, type);
      setHasVoted(true);
      setVoteCount(prev => prev + 1);
      
      const updatedPosts = [...posts];
      if (type === 'yes') updatedPosts[currentPostIndex].yes_votes++;
      if (type === 'no') updatedPosts[currentPostIndex].no_votes++;
      if (type === 'neutral') updatedPosts[currentPostIndex].neutral_votes++;
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Vote failed', error);
    }
  };

  const handleNext = () => {
    if (currentPostIndex < posts.length - 1) {
      setCurrentPostIndex(prev => prev + 1);
      setHasVoted(false);
    } else {
      loadPosts();
    }
  };

  const selectCategory = (cat: Category | null) => {
    setSelectedCategory(cat);
    setIsPickerVisible(false);
  };

  const currentPost = posts[currentPostIndex];

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Remove /storage from STORAGE_URL if path already includes it
    const baseUrl = STORAGE_URL.replace(/\/storage$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerBrand}>Like It{"\n"}Or Not?</Text>
        </View>
        <TouchableOpacity 
          style={styles.pickerContainer} 
          onPress={() => setIsPickerVisible(true)}
        >
          <Text style={styles.pickerText}>{selectedCategory ? selectedCategory.name : 'Anything'}</Text>
          <IconSymbol name="chevron.down" size={14} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <HamburgerMenu />
        </View>
      </View>

      <Modal
        visible={isPickerVisible}
        transparent={true}
        animationType="fade"
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
              <Text style={[styles.categoryItemText, selectedCategory === null && styles.categoryItemTextActive]}>Anything</Text>
              {selectedCategory === null && <IconSymbol name="checkmark" size={18} color="#FFF" />}
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.categoryItem, selectedCategory?.id === cat.id && styles.categoryItemActive]}
                onPress={() => selectCategory(cat)}
              >
                <Text style={[styles.categoryItemText, selectedCategory?.id === cat.id && styles.categoryItemTextActive]}>{cat.name}</Text>
                {selectedCategory?.id === cat.id && <IconSymbol name="checkmark" size={18} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : currentPost ? (
          <View style={styles.card}>
            <View style={[styles.imageContainer, hasVoted && styles.imageContainerSmall]}>
              <Image 
                source={{ uri: getImageUrl(currentPost.image_path) }} 
                style={styles.postImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.title}>{currentPost.title}</Text>
              {currentPost.description && (
                <Text style={styles.subtitle}>{currentPost.description}</Text>
              )}
            </View>

            {!hasVoted ? (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.voteOptions}>
                <TouchableOpacity style={styles.voteButton} onPress={() => handleVote('yes')}>
                  <IconSymbol name="face.smiling" size={64} color="#1C1C1E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.voteButton} onPress={() => handleVote('neutral')}>
                  <IconSymbol name="face.dashed" size={64} color="#1C1C1E" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.voteButton} onPress={() => handleVote('no')}>
                  <IconSymbol name="face.smiling.inverse" size={64} color="#1C1C1E" />
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.resultsContainer}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <IconSymbol name="face.smiling" size={48} color="#1C1C1E" />
                    <Text style={styles.statPercent}>
                      {Math.round((currentPost.yes_votes / (currentPost.yes_votes + currentPost.no_votes + currentPost.neutral_votes || 1)) * 100)}%
                    </Text>
                    <Text style={styles.statVotes}>{currentPost.yes_votes} votes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <IconSymbol name="face.dashed" size={48} color="#1C1C1E" />
                    <Text style={styles.statPercent}>
                      {Math.round((currentPost.neutral_votes / (currentPost.yes_votes + currentPost.no_votes + currentPost.neutral_votes || 1)) * 100)}%
                    </Text>
                    <Text style={styles.statVotes}>{currentPost.neutral_votes} votes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <IconSymbol name="face.smiling.inverse" size={48} color="#1C1C1E" />
                    <Text style={styles.statPercent}>
                      {Math.round((currentPost.no_votes / (currentPost.yes_votes + currentPost.no_votes + currentPost.neutral_votes || 1)) * 100)}%
                    </Text>
                    <Text style={styles.statVotes}>{currentPost.no_votes} votes</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.backLink} onPress={() => setHasVoted(false)}>
                    <Text style={styles.backText}>&lt; Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>NEXT &gt;</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.noPostsText}>No posts found in this category.</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadPosts}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <IconSymbol name="flame.fill" size={24} color="#FFF" />
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>You have {voteCount} votes this session.</Text>
          <Text style={styles.footerText}>Keep cooking, my friend!</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  header: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerBrand: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  pickerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    alignItems: 'center',
  },
  imageContainer: {
    width: width - 64,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    marginBottom: 24,
    backgroundColor: '#F2F2F7',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageContainerSmall: {
    width: width - 120,
    aspectRatio: 1,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1C1C1E',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  voteOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  voteButton: {
    padding: 8,
  },
  resultsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statPercent: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  statVotes: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
  },
  backLink: {
    padding: 8,
  },
  backText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  nextButton: {
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    minWidth: 160,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1C1E',
  },
  noPostsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  refreshButton: {
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  footerTextContainer: {
    flex: 1,
  },
  footerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
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
