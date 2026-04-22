import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from './ui/icon-symbol';

export function HamburgerMenu() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const navigateTo = (path: string) => {
    setIsVisible(false);
    router.replace(path as any);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => setIsVisible(true)} 
        style={styles.menuButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <IconSymbol name="line.3.horizontal" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={[styles.menuContent, { top: insets.top + 50 }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('/(tabs)/explore')}
            >
              <IconSymbol name="person.fill" size={24} color="#1C1C1E" />
              <Text style={styles.menuItemText}>View Profile</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('/(tabs)/upload')}
            >
              <IconSymbol name="plus.square.fill" size={24} color="#1C1C1E" />
              <Text style={styles.menuItemText}>Create Item</Text>
            </TouchableOpacity>
            
            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('/my-posts')}
            >
              <IconSymbol name="square.grid.2x2.fill" size={24} color="#1C1C1E" />
              <Text style={styles.menuItemText}>My Posts</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo('/(tabs)')}
            >
              <IconSymbol name="hand.thumbsup.fill" size={24} color="#1C1C1E" />
              <Text style={styles.menuItemText}>Voting Home</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99,
  },
  menuButton: {
    padding: 4,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContent: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    padding: 8,
    width: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 8,
  },
});
