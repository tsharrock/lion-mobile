import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { HamburgerMenu } from '../components/hamburger-menu';
import { leaderboardService } from '../services/api';
import { STORAGE_URL } from '../constants/api';

const { width } = Dimensions.get('window');

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const stripped = path.replace(/^\/?storage\//, '');
  const cleanPath = stripped.startsWith('/') ? stripped : `/${stripped}`;
  return `${STORAGE_URL}${cleanPath}`;
};

interface LeaderboardPost {
  id: number;
  title: string;
  description: string | null;
  image_path: string;
  category: { id: number; name: string; slug: string };
  yes_votes: number;
  no_votes: number;
  neutral_votes: number;
  total_votes: number;
  yes_percentage: number;
  no_percentage: number;
  neutral_percentage: number;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<LeaderboardPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<'highest' | 'lowest'>('highest');
  const [selectedPost, setSelectedPost] = useState<LeaderboardPost | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard(sort);
    }, [sort])
  );

  const loadLeaderboard = async (sortOrder: 'highest' | 'lowest') => {
    setIsLoading(true);
    try {
      const res = await leaderboardService.get(sortOrder);
      console.log('Leaderboard raw response:', JSON.stringify(res.data).slice(0, 500));
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setPosts(data);
    } catch (error) {
      console.error('Failed to load leaderboard', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (newSort: 'highest' | 'lowest') => {
    if (newSort === sort) return;
    setSort(newSort);
  };

  if (selectedPost) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerBrand}>Like It{'\n'}Or Not?</Text>
          <HamburgerMenu />
        </View>

        <ScrollView contentContainerStyle={styles.detailScroll}>
          <Image
            source={{ uri: getImageUrl(selectedPost.image_path) }}
            style={styles.detailImage}
            resizeMode="cover"
          />

          <View style={styles.detailBody}>
            <Text style={styles.detailTitle}>{selectedPost.title}</Text>
            {selectedPost.description ? (
              <Text style={styles.detailDescription}>{selectedPost.description}</Text>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>😊</Text>
                <Text style={styles.statPct}>{selectedPost.yes_percentage}%</Text>
                <Text style={styles.statCount}>{selectedPost.yes_votes.toLocaleString()} votes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>😐</Text>
                <Text style={styles.statPct}>{selectedPost.neutral_percentage}%</Text>
                <Text style={styles.statCount}>{selectedPost.neutral_votes.toLocaleString()} votes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>😞</Text>
                <Text style={styles.statPct}>{selectedPost.no_percentage}%</Text>
                <Text style={styles.statCount}>{selectedPost.no_votes.toLocaleString()} votes</Text>
              </View>
            </View>

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={styles.backToListButton}
                onPress={() => setSelectedPost(null)}
              >
                <Text style={styles.backToListText}>‹ Back to Leaderboard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.voteButton}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.voteButtonText}>Vote on This</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerBrand}>Like It{'\n'}Or Not?</Text>
        <HamburgerMenu />
      </View>

      <View style={styles.sortRow}>
        <TouchableOpacity onPress={() => handleSortChange('highest')} style={styles.sortTab}>
          <Text style={[styles.sortTabText, sort === 'highest' && styles.sortTabActive]}>
            Highest
          </Text>
          {sort === 'highest' && <View style={styles.sortUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSortChange('lowest')} style={styles.sortTab}>
          <Text style={[styles.sortTabText, sort === 'lowest' && styles.sortTabActive]}>
            Lowest
          </Text>
          {sort === 'lowest' && <View style={styles.sortUnderline} />}
        </TouchableOpacity>
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
              style={[styles.row, index % 2 === 1 && styles.rowAlt]}
              onPress={() => setSelectedPost(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.rank}>{index + 1}</Text>
              <Image
                source={{ uri: getImageUrl(item.image_path) }}
                style={styles.rowThumb}
              />
              <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.rowStats}>
                <View style={styles.rowStat}>
                  <Text style={styles.rowStatEmoji}>😊</Text>
                  <Text style={styles.rowStatPct}>{item.yes_percentage}%</Text>
                </View>
                <View style={styles.rowStat}>
                  <Text style={styles.rowStatEmoji}>😐</Text>
                  <Text style={styles.rowStatPct}>{item.neutral_percentage}%</Text>
                </View>
                <View style={styles.rowStat}>
                  <Text style={styles.rowStatEmoji}>😞</Text>
                  <Text style={styles.rowStatPct}>{item.no_percentage}%</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No posts with votes yet.</Text>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap a post to see the full breakdown</Text>
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

  sortRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#1C1C1E',
  },
  sortTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  sortTabText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#888',
  },
  sortTabActive: {
    color: '#1C1C1E',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  sortUnderline: {
    height: 3,
    backgroundColor: '#1C1C1E',
    width: '60%',
    marginTop: 4,
  },

  listContent: { paddingBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  rowAlt: { backgroundColor: '#F2F2F7' },
  rank: {
    width: 24,
    fontSize: 13,
    fontWeight: '800',
    color: '#888',
    textAlign: 'center',
  },
  rowThumb: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 4,
  },
  rowTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  rowStats: {
    flexDirection: 'row',
    gap: 6,
  },
  rowStat: {
    alignItems: 'center',
    minWidth: 36,
  },
  rowStatEmoji: { fontSize: 14 },
  rowStatPct: { fontSize: 11, fontWeight: '700', color: '#1C1C1E' },

  footer: {
    backgroundColor: '#000',
    padding: 16,
    alignItems: 'center',
  },
  footerText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  // Detail view
  detailScroll: { paddingBottom: 40 },
  detailImage: {
    width,
    height: width * 0.75,
    backgroundColor: '#E5E5EA',
  },
  detailBody: {
    padding: 24,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingVertical: 24,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#1C1C1E',
  },
  statItem: { alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 40 },
  statPct: { fontSize: 28, fontWeight: '900', color: '#1C1C1E' },
  statCount: { fontSize: 12, fontWeight: '600', color: '#888' },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backToListButton: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToListText: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
  voteButton: {
    flex: 1,
    height: 52,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteButtonText: { fontSize: 15, fontWeight: '800', color: '#FFF' },

  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyText: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
});
