import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import RenderMdx from "./index";

// Example MDX content
const exampleMdx = `
# MDX Example in React Native

This is a paragraph with **bold text** and *italic text*.

## Lists

* Item 1
* Item 2
* Item 3

### Unordered List
- Item 1
- Item 2
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Code

Inline \`code\` example.

\`\`\`javascript
// Code block
function hello() {
  console.log('Hello, world!');
}
\`\`\`

## Custom Component

<CustomComponent>This is a custom component rendered inside MDX!</CustomComponent>

## Links

[Visit Expo](https://expo.dev)

## Images

![React Native Logo](https://reactnative.dev/img/header_logo.svg)

## Blockquote

> This is a blockquote.
> It can span multiple lines.

## Table

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;

export function MdxExample() {
  return <RenderMdx content={exampleMdx} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  customComponent: {
    padding: 16,
    marginVertical: 8,
    backgroundColor: "#dbeafe",
    borderRadius: 8,
  },
  customComponentText: {
    color: "#1e40af",
    fontWeight: "500",
  },
});
