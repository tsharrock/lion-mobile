import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { HamburgerMenu } from '../components/hamburger-menu';
import { postService } from '../services/api';
import { STORAGE_URL } from '../constants/api';

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Strip duplicate /storage prefix from path if already present
  const stripped = path.replace(/^\/?storage\//, '');
  const cleanPath = stripped.startsWith('/') ? stripped : `/${stripped}`;
  return `${STORAGE_URL}${cleanPath}`;
};

interface Post {
  id: number;
  title: string;
  description: string | null;
  image_path: string;
  requires_attribution: boolean;
  image_attribution: string | null;
  category: { id: number; name: string; slug: string };
  yes_votes: number;
  no_votes: number;
  neutral_votes: number;
  created_at: string;
}

export default function MyPostsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const res = await postService.getMyPosts();
      setPosts(res.data);
    } catch (error) {
      console.error('Failed to load posts', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalVotes = (post: Post) => post.yes_votes + post.no_votes + post.neutral_votes;

  const openStats = (post: Post) => {
    router.push({
      pathname: '/post-stats',
      params: { post: JSON.stringify(post) },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerBrand}>Like It{'\n'}Or Not?</Text>
        <HamburgerMenu />
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>My Posts</Text>
        <Text style={styles.count}>{posts.length}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.postItem, index % 2 === 1 && styles.postItemAlt]}
              onPress={() => openStats(item)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: getImageUrl(item.image_path) }}
                style={styles.thumbnail}
              />
              <View style={styles.postInfo}>
                <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.postCategory}>{item.category.name}</Text>
                <Text style={styles.postDate}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={styles.votesSummary}>
                <Text style={styles.votesTotal}>{totalVotes(item)}</Text>
                <Text style={styles.votesLabel}>votes</Text>
                <Text style={styles.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>You haven't posted anything yet.</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.replace('/(tabs)/upload')}
              >
                <Text style={styles.createButtonText}>Create a Post &gt;</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap a post to see how people voted</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  backText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  headerBrand: { color: '#FFF', fontSize: 14, fontWeight: '800', lineHeight: 16, textAlign: 'center' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1C1C1E',
  },
  title: { fontSize: 32, fontWeight: '900' },
  count: { fontSize: 32, fontWeight: '900', color: '#666' },
  listContent: { paddingBottom: 20 },
  postItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  postItemAlt: { backgroundColor: '#F2F2F7' },
  thumbnail: {
    width: 64,
    height: 64,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 4,
  },
  postInfo: { flex: 1 },
  postTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  postCategory: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 2 },
  postDate: { fontSize: 11, fontWeight: '500', color: '#888' },
  votesSummary: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  votesTotal: { fontSize: 22, fontWeight: '900' },
  votesLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginTop: 2 },
  chevron: { fontSize: 24, fontWeight: '700', color: '#888', marginLeft: 4 },
  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 32 },
  createButton: {
    height: 52,
    paddingHorizontal: 32,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: { fontSize: 20, fontWeight: '800' },
  footer: {
    backgroundColor: '#000',
    padding: 16,
    alignItems: 'center',
  },
  footerText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
