import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HamburgerMenu } from '../../components/hamburger-menu';
import { authService, profileService } from '../../services/api';
import { IconSymbol } from '@/components/ui/icon-symbol';

type ProfileView = 'main' | 'stats' | 'history';

interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface Stats {
  total_votes: number;
  yes_votes: number;
  no_votes: number;
  neutral_votes: number;
  yes_pct: number;
  no_pct: number;
  neutral_pct: number;
  total_sessions: number;
  avg_votes_per_session: number;
  most_votes_in_session: number;
  top_category: string | null;
  top_category_pct: number;
}

interface VoteHistory {
  id: number;
  type: 'yes' | 'no' | 'neutral';
  post: { title: string };
  created_at: string;
}

const VOTE_ICON: Record<string, string> = {
  yes: 'face.smiling',
  neutral: 'face.dashed',
  no: 'face.smiling.inverse',
};

export default function ProfileScreen() {
  const router = useRouter();
  const [view, setView] = useState<ProfileView>('main');
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<VoteHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const [userRes, statsRes, historyRes] = await Promise.all([
        authService.getUser(),
        profileService.getStats(),
        profileService.getHistory(),
      ]);
      setUser(userRes.data);
      setStats(statsRes.data);
      setHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  const renderMain = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.viewContainer}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>Like It{"\n"}Or Not?</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          <HamburgerMenu />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileInfo}>
          <View style={styles.profilePicLarge}>
            <View style={styles.gridPlaceholder}>
              <View style={styles.diagonal1} />
              <View style={styles.diagonal2} />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>

          <View style={styles.detailsList}>
            <Text style={styles.detailItem}><Text style={styles.detailLabel}>Email:</Text> {user?.email}</Text>
            <Text style={styles.detailItem}><Text style={styles.detailLabel}>Date joined:</Text> {user ? formatDate(user.created_at) : '...'}</Text>
            <Text style={styles.detailItem}><Text style={styles.detailLabel}>Total votes:</Text> {stats?.total_votes ?? '...'}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.outlineButton} onPress={() => setView('stats')}>
              <Text style={styles.outlineButtonText}>Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton} onPress={() => setView('history')}>
              <Text style={styles.outlineButtonText}>History</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.myPostsButton} onPress={() => router.push('/my-posts')}>
            <Text style={styles.outlineButtonText}>My Posts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryButtonText}>Return to Voting &gt;</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <IconSymbol name="calendar" size={24} color="#FFF" />
        <View style={styles.footerTextContainer}>
          <Text style={styles.footerText}>We have your entire voting history...</Text>
          <Text style={styles.footerText}>Tap the button above to see everything you've voted</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderStats = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.viewContainer}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>Like It{"\n"}Or Not?</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setView('main')}>
            <IconSymbol name="xmark" size={24} color="#FFF" />
          </TouchableOpacity>
          <HamburgerMenu />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statsView}>
          <View style={styles.profilePicSmall}>
            <View style={styles.gridPlaceholder}>
              <View style={styles.diagonal1} />
              <View style={styles.diagonal2} />
            </View>
          </View>
          <Text style={styles.viewHeading}>Your Stats</Text>
          <Text style={styles.totalVotesCount}>{stats?.total_votes ?? 0} total votes</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <IconSymbol name="face.smiling" size={40} color="#1C1C1E" />
              <Text style={styles.statVal}>{stats?.yes_pct ?? 0}%</Text>
              <Text style={styles.statLabel}>{stats?.yes_votes ?? 0} votes</Text>
            </View>
            <View style={styles.statBox}>
              <IconSymbol name="face.dashed" size={40} color="#1C1C1E" />
              <Text style={styles.statVal}>{stats?.neutral_pct ?? 0}%</Text>
              <Text style={styles.statLabel}>{stats?.neutral_votes ?? 0} votes</Text>
            </View>
            <View style={styles.statBox}>
              <IconSymbol name="face.smiling.inverse" size={40} color="#1C1C1E" />
              <Text style={styles.statVal}>{stats?.no_pct ?? 0}%</Text>
              <Text style={styles.statLabel}>{stats?.no_votes ?? 0} votes</Text>
            </View>
          </View>

          <View style={styles.secondaryStats}>
            <View style={styles.secStatItem}>
              <Text style={styles.secStatVal}>{stats?.total_sessions ?? 0}</Text>
              <Text style={styles.secStatLabel}>Total sessions</Text>
            </View>
            <View style={styles.secStatItem}>
              <Text style={styles.secStatVal}>{stats?.avg_votes_per_session ?? 0}</Text>
              <Text style={styles.secStatLabel}>Avg. votes per session</Text>
            </View>
            <View style={styles.secStatItem}>
              <Text style={styles.secStatVal}>{stats?.most_votes_in_session ?? 0}</Text>
              <Text style={styles.secStatLabel}>Most votes in a session</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.outlineButton} onPress={() => setView('history')}>
              <Text style={styles.outlineButtonText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButtonHalf} onPress={() => router.replace('/(tabs)')}>
              <Text style={styles.primaryButtonText}>Vote &gt;</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color="#FFF" />
        <View style={styles.footerTextContainer}>
          {stats?.top_category ? (
            <Text style={styles.footerText}>
              {stats.top_category} is your most voted category, with {stats.top_category_pct}% of your total {stats.total_votes} votes.
            </Text>
          ) : (
            <Text style={styles.footerText}>Start voting to see your stats!</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );

  const renderHistory = () => (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.viewContainer}>
      <View style={styles.header}>
        <Text style={styles.headerBrand}>Like It{"\n"}Or Not?</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setView('main')}>
            <IconSymbol name="xmark" size={24} color="#FFF" />
          </TouchableOpacity>
          <HamburgerMenu />
        </View>
      </View>

      <View style={styles.historyListContainer}>
        <View style={[styles.profilePicSmall, { alignSelf: 'center', marginTop: 16 }]}>
          <View style={styles.gridPlaceholder}>
            <View style={styles.diagonal1} />
            <View style={styles.diagonal2} />
          </View>
        </View>
        <Text style={[styles.viewHeading, { textAlign: 'center', marginBottom: 16 }]}>Your History</Text>

        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View style={[styles.historyItem, index % 2 === 1 && styles.historyItemAlt]}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyName}>{item.post.title}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                <IconSymbol name={VOTE_ICON[item.type]} size={24} color="#1C1C1E" />
              </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', padding: 40, fontSize: 18, fontWeight: '700' }}>
              No voting history yet.
            </Text>
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <View style={styles.footer}>
        <IconSymbol name="figure.american.football" size={24} color="#FFF" />
        <View style={styles.footerTextContainer}>
          {stats?.top_category ? (
            <Text style={styles.footerText}>
              {stats.top_category} is your most voted category, with {stats.top_category_pct}% of your total {stats.total_votes} votes.
            </Text>
          ) : (
            <Text style={styles.footerText}>Start voting to see your top category!</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {view === 'main' && renderMain()}
      {view === 'stats' && renderStats()}
      {view === 'history' && renderHistory()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBrand: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  editText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  editButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profilePicLarge: {
    width: 140,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    marginBottom: 20,
  },
  profilePicSmall: {
    width: 60,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    marginBottom: 12,
  },
  gridPlaceholder: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
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
  userName: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 24,
  },
  detailsList: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  detailItem: {
    fontSize: 18,
    fontWeight: '500',
  },
  detailLabel: {
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    marginBottom: 16,
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
  outlineButtonText: {
    fontSize: 24,
    fontWeight: '800',
  },
  myPostsButton: {
    width: '100%',
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  primaryButtonHalf: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  primaryButtonText: {
    fontSize: 24,
    fontWeight: '800',
  },
  statsView: {
    alignItems: 'center',
  },
  viewHeading: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  totalVotesCount: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    fontSize: 32,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  secStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  secStatVal: {
    fontSize: 32,
    fontWeight: '900',
  },
  secStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyListContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  historyItemAlt: {
    backgroundColor: '#F2F2F7',
  },
  historyLeft: {
    flex: 1,
  },
  historyName: {
    fontSize: 20,
    fontWeight: '800',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
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
    fontSize: 12,
    fontWeight: '700',
  },
});
