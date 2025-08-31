/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  onRequestClose: () => void;
};

const ImageDefaultHeader = ({ onRequestClose }: Props) => {
  return (
    <SafeAreaView style={styles.root}>
      <TouchableOpacity
        style={[styles.closeButton, styles.blurredBackground]}
        onPress={onRequestClose}
        accessibilityRole="button"
        accessibilityLabel={'Close image'}
        accessibilityHint={'Closes viewer for header image'}
        onAccessibilityEscape={onRequestClose}
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-end',
    pointerEvents: 'box-none',
  },
  closeButton: {
    marginRight: 10,
    marginTop: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#00000077',
  },
  blurredBackground: {
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  } as ViewStyle,
});

export default ImageDefaultHeader;
