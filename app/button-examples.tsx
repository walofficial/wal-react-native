import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import Button from '@/components/Button';
import { useTheme } from '@/lib/theme';

export default function ButtonExamplesScreen() {
  const theme = useTheme();
  return (
    <ScrollView
      contentContainerStyle={{
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
        gap: theme.spacing.md,
      }}
    >
      <Text
        style={{
          fontSize: theme.fontSizes.lg,
          fontWeight: '700',
          color: theme.colors.text,
          marginBottom: theme.spacing.md,
        }}
      >
        Button Variants
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <Button title="Default" variant="default" onPress={() => {}} />
        <Button title="Primary" variant="primary" onPress={() => {}} />
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Outline" variant="outline" onPress={() => {}} />
        <Button title="Destructive" variant="destructive" onPress={() => {}} />
      </View>

      <Text
        style={{
          fontSize: theme.fontSizes.lg,
          fontWeight: '700',
          color: theme.colors.text,
          marginVertical: theme.spacing.md,
        }}
      >
        Sizes
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <Button title="Medium" size="medium" onPress={() => {}} />
        <Button title="Large" size="large" onPress={() => {}} />
      </View>

      <Text
        style={{
          fontSize: theme.fontSizes.lg,
          fontWeight: '700',
          color: theme.colors.text,
          marginVertical: theme.spacing.md,
        }}
      >
        Icons
      </Text>
      <View style={{ gap: theme.spacing.sm }}>
        <Button title="Add" icon="add" variant="primary" onPress={() => {}} />
        <Button
          title="Send"
          icon="send"
          iconPosition="right"
          variant="secondary"
          onPress={() => {}}
        />
        <Button
          icon="heart"
          size="large"
          variant="outline"
          onPress={() => {}}
        />
      </View>

      <Text
        style={{
          fontSize: theme.fontSizes.lg,
          fontWeight: '700',
          color: theme.colors.text,
          marginVertical: theme.spacing.md,
        }}
      >
        Full Width
      </Text>
      <Button title="Continue" fullWidth size="large" onPress={() => {}} />

      <Text
        style={{
          fontSize: theme.fontSizes.lg,
          fontWeight: '700',
          color: theme.colors.text,
          marginVertical: theme.spacing.md,
        }}
      >
        Square Icon Buttons
      </Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <Button icon="add" variant="primary" size="medium" onPress={() => {}} />
        <Button
          icon="camera"
          variant="outline"
          size="medium"
          onPress={() => {}}
        />
        <Button
          icon="trash"
          variant="destructive"
          size="medium"
          onPress={() => {}}
        />
      </View>

      <Text
        style={{
          fontSize: theme.fontSizes.lg,
          fontWeight: '700',
          color: theme.colors.text,
          marginVertical: theme.spacing.md,
        }}
      >
        Big Rounded Square Icon Buttons
      </Text>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <Button
          icon="add"
          variant="primary"
          size="large"
          onPress={() => {}}
          style={{ width: 56, height: 56, borderRadius: 10 }}
        />
        <Button
          icon="camera"
          variant="secondary"
          size="large"
          onPress={() => {}}
          style={{ width: 56, height: 56, borderRadius: 10 }}
        />
        <Button
          icon="trash"
          variant="destructive"
          size="large"
          onPress={() => {}}
          style={{ width: 56, height: 56, borderRadius: 10 }}
        />
      </View>
    </ScrollView>
  );
}
