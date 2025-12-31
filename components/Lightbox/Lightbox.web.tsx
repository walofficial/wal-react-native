import React from 'react';
import { StyleSheet, View, Pressable, Image, Modal } from 'react-native';
import { useLightbox, useLightboxControls } from '@/lib/lightbox/lightbox';
import { Ionicons } from '@expo/vector-icons';

export function Lightbox() {
  const { activeLightbox } = useLightbox();
  const { closeLightbox } = useLightboxControls();

  const onClose = React.useCallback(() => {
    closeLightbox();
  }, [closeLightbox]);

  if (!activeLightbox) {
    return null;
  }

  const { images, index } = activeLightbox;
  const currentImage = images[index];

  return (
    <Modal
      visible={!!activeLightbox}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: currentImage.uri }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="white" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  imageContainer: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
});

