import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HamburgerMenu } from '../components/hamburger-menu';
import { IconSymbol } from '../components/ui/icon-symbol';
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

export default function PostStatsScreen() {
  const router = useRouter();
  const { post: postParam } = useLocalSearchParams<{ post: string }>();

  const post = useMemo<Post | null>(() => {
    try {
      return postParam ? JSON.parse(postParam) : null;
    } catch {
      return null;
    }
  }, [postParam]);

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Post not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const total = post.yes_votes + post.no_votes + post.neutral_votes;
  const pct = (votes: number) => total > 0 ? Math.round((votes / total) * 100) : 0;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerBrand}>Like It{'\n'}Or Not?</Text>
        <HamburgerMenu />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.postImageContainer}>
          <Image
            source={{ uri: getImageUrl(post.image_path) }}
            style={styles.postImage}
            resizeMode="cover"
          />
          {post.requires_attribution && post.image_attribution && (
            <View style={styles.attributionOverlay}>
              <Text style={styles.attributionText}>{post.image_attribution}</Text>
            </View>
          )}
        </View>

        <View style={styles.postMeta}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postCategory}>{post.category.name}</Text>
          {post.description ? (
            <Text style={styles.postDescription}>{post.description}</Text>
          ) : null}
          <Text style={styles.postDate}>Posted {formatDate(post.created_at)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statsSection}>
          <Text style={styles.statsHeading}>Results</Text>
          <Text style={styles.totalVotes}>{total} total votes</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <IconSymbol name="face.smiling" size={44} color="#1C1C1E" />
              <Text style={styles.statPct}>{pct(post.yes_votes)}%</Text>
              <Text style={styles.statCount}>{post.yes_votes} votes</Text>
              <Text style={styles.statType}>Yes</Text>
            </View>
            <View style={styles.statBox}>
              <IconSymbol name="face.dashed" size={44} color="#1C1C1E" />
              <Text style={styles.statPct}>{pct(post.neutral_votes)}%</Text>
              <Text style={styles.statCount}>{post.neutral_votes} votes</Text>
              <Text style={styles.statType}>Neutral</Text>
            </View>
            <View style={styles.statBox}>
              <IconSymbol name="face.smiling.inverse" size={44} color="#1C1C1E" />
              <Text style={styles.statPct}>{pct(post.no_votes)}%</Text>
              <Text style={styles.statCount}>{post.no_votes} votes</Text>
              <Text style={styles.statType}>No</Text>
            </View>
          </View>

          <View style={styles.barSection}>
            <View style={styles.barContainer}>
              <View style={[styles.barSegment, { flex: post.yes_votes || 0.001, backgroundColor: '#1C1C1E' }]} />
              <View style={[styles.barSegment, { flex: post.neutral_votes || 0.001, backgroundColor: '#888' }]} />
              <View style={[styles.barSegment, { flex: post.no_votes || 0.001, backgroundColor: '#CCC' }]} />
            </View>
            <View style={styles.barLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#1C1C1E' }]} />
                <Text style={styles.legendLabel}>Yes</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#888' }]} />
                <Text style={styles.legendLabel}>Neutral</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#CCC' }]} />
                <Text style={styles.legendLabel}>No</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => router.replace('/my-posts')}
          >
            <Text style={styles.outlineButtonText}>All My Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.primaryButtonText}>Vote &gt;</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {total === 0
            ? 'No votes yet — share your post to get results!'
            : `${pct(post.yes_votes)}% of voters said yes to "${post.title}"`}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  errorText: { fontSize: 20, fontWeight: '700' },
  backLink: { fontSize: 18, fontWeight: '700', textDecorationLine: 'underline' },
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
  scrollContent: { paddingBottom: 24 },
  postImageContainer: {
    width: '100%',
    height: 260,
    overflow: 'hidden',
    borderBottomWidth: 2,
    borderBottomColor: '#1C1C1E',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  attributionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attributionText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '500',
  },
  postMeta: { padding: 24, paddingBottom: 16 },
  postTitle: { fontSize: 28, fontWeight: '900', marginBottom: 6 },
  postCategory: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 8 },
  postDescription: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 8 },
  postDate: { fontSize: 12, fontWeight: '600', color: '#888' },
  divider: { height: 2, backgroundColor: '#1C1C1E', marginHorizontal: 24 },
  statsSection: { padding: 24 },
  statsHeading: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  totalVotes: { fontSize: 20, fontWeight: '700', color: '#555', marginBottom: 32 },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statBox: { alignItems: 'center', gap: 4 },
  statPct: { fontSize: 32, fontWeight: '900' },
  statCount: { fontSize: 13, fontWeight: '600', color: '#555' },
  statType: { fontSize: 13, fontWeight: '700' },
  barSection: { marginBottom: 32 },
  barContainer: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1C1C1E',
    marginBottom: 8,
  },
  barSegment: { height: '100%' },
  barLegend: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#ccc' },
  legendLabel: { fontSize: 13, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  outlineButton: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonText: { fontSize: 18, fontWeight: '800' },
  primaryButton: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  primaryButtonText: { fontSize: 24, fontWeight: '800' },
  footer: {
    backgroundColor: '#000',
    padding: 16,
    alignItems: 'center',
  },
  footerText: { color: '#FFF', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
