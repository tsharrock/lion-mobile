import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categoryService, postService } from '../../services/api';
import { API_URL } from '../../constants/api';
import { HamburgerMenu } from '../../components/hamburger-menu';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function UploadScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result.canceled ? 'canceled' : 'success');

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageAsset(result.assets[0]);
      }
    } catch (e) {
      console.error('Pick image error:', e);
      alert('Failed to open image library');
    }
  };

  const handleUpload = async () => {
    console.log('POST IT clicked');
    
    if (!imageAsset || !title || !selectedCategory) {
      console.log('Validation failed:', { hasImage: !!imageAsset, hasTitle: !!title, hasCategory: !!selectedCategory });
      Alert.alert('Error', 'Please provide a title, category, and an image.');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Preparing upload payload...');
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description || '');
      formData.append('category_id', selectedCategory.id.toString());
      
      const uri = imageAsset.uri;
      const type = imageAsset.mimeType || 'image/jpeg';
      const filename = imageAsset.fileName || uri.split('/').pop() || 'photo.jpg';

      if (Platform.OS === 'web') {
        const res = await fetch(uri);
        const blob = await res.blob();
        formData.append('image', blob, filename);
      } else {
        // @ts-ignore — RN patches FormData to accept this shape
        formData.append('image', { uri, name: filename, type });
      }

      console.log('Sending request to postService.create...', {
        url: `${API_URL}/posts`,
        filename,
        type,
        uri: uri.substring(0, 50) + '...'
      });

      const response = await postService.create(formData);
      console.log('Upload SUCCESS:', response.data);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert('Success', 'Post uploaded successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
      
      // Fallback alert for web or if Alert.alert fails
      if (Platform.OS === 'web') {
        alert('Post uploaded successfully!');
        router.replace('/(tabs)');
      }

    } catch (error: any) {
      console.error('Upload CATCH error:', error);
      
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error message:', errorMsg);
      
      Alert.alert('Upload Failed', errorMsg);
      
      // Fallback for debugging
      if (Platform.OS === 'web') {
        alert('Upload failed: ' + errorMsg);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }} />
        <Text style={styles.headerBrand}>NEW POST</Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <HamburgerMenu />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageAsset ? (
              <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.pickerPlaceholder}>
                <IconSymbol name="photo.badge.plus" size={48} color="#1C1C1E" />
                <Text style={styles.pickerText}>Select Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="What is this?"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity 
                style={styles.pickerTrigger} 
                onPress={() => setIsPickerVisible(true)}
              >
                <Text style={styles.pickerTriggerText}>
                  {selectedCategory ? selectedCategory.name : 'Select a category'}
                </Text>
                <IconSymbol name="chevron.down" size={16} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Short Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Give some context..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity 
              style={[styles.uploadButton, isUploading && styles.disabledButton]} 
              onPress={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.uploadButtonText}>POST IT &gt;</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[
                  styles.categoryItem,
                  selectedCategory?.id === cat.id && styles.categoryItemActive
                ]}
                onPress={() => {
                  setSelectedCategory(cat);
                  setIsPickerVisible(false);
                }}
              >
                <Text style={[
                  styles.categoryItemText,
                  selectedCategory?.id === cat.id && styles.categoryItemTextActive
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#000',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scrollContent: {
    padding: 24,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 3,
    borderColor: '#1C1C1E',
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    gap: 12,
  },
  pickerText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  input: {
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  pickerTrigger: {
    height: 52,
    borderWidth: 2,
    borderColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTriggerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  uploadButton: {
    height: 60,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
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
    alignItems: 'center',
    justifyContent: 'center',
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
