import * as React from "react";
import { TextInput, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  textarea: {
    minHeight: 80,
    width: "100%",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    lineHeight: 20,
    color: "#000",
  },
  disabled: {
    opacity: 0.5,
  },
});

const Textarea = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  React.ComponentPropsWithoutRef<typeof TextInput>
>(({ style, multiline = true, numberOfLines = 4, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      style={[
        styles.textarea,
        props.editable === false && styles.disabled,
        style,
      ]}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      placeholderTextColor="#666"
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
