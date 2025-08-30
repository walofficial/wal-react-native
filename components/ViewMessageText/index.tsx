import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/text';

function ViewMessageText({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 20,
  },
});

export default ViewMessageText;
