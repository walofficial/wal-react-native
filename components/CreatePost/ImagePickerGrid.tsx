import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { ImagePickerAsset } from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ImagePickerGridProps {
  selectedImages: ImagePickerAsset[];
  onRemoveImage: (index: number) => void;
  onCopyImage?: (imageUri: string, index: number) => void;
}

export default function ImagePickerGrid({
  selectedImages,
  onRemoveImage,
  onCopyImage,
}: ImagePickerGridProps) {
  if (selectedImages.length === 0) return null;

  return (
    <View style={styles.container}>
      {selectedImages.map((image, index) => (
        <View key={image.uri} style={styles.imageContainer}>
          <Image source={{ uri: image.uri }} style={styles.image} />

          {/* Copy Button */}
          {onCopyImage && (
            <TouchableOpacity
              onPress={() => onCopyImage(image.uri, index)}
              style={styles.copyButton}
            >
              <Ionicons name="copy-outline" size={16} color="white" />
            </TouchableOpacity>
          )}

          {/* Remove Button */}
          <TouchableOpacity
            onPress={() => onRemoveImage(index)}
            style={styles.removeButton}
          >
            <Ionicons name="close-circle" size={20} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 112,
    height: 112,
    borderRadius: 8,
  },
  copyButton: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    padding: 4,
  },
});
