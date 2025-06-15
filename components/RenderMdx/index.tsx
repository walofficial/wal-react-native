import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/lib/theme";
import { useColorScheme } from "@/lib/useColorScheme";

interface RenderMdxProps {
  content: string;
}

const RenderMdx: React.FC<RenderMdxProps> = ({ content }) => {
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  // Create dynamic styles based on theme
  const dynamicStyles = StyleSheet.create({
    heading1: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 16,
      marginTop: 24,
    },
    heading2: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 12,
      marginTop: 20,
    },
    heading3: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    paragraph: {
      fontSize: 16,
      color: theme.colors.text,
      marginBottom: 12,
      lineHeight: 24,
    },
    bold: {
      fontWeight: "bold",
      color: theme.colors.text,
    },
    italic: {
      fontStyle: "italic",
      color: theme.colors.text,
      fontWeight: "normal",
    },
    bulletList: {
      marginBottom: 12,
    },
    bulletItem: {
      flexDirection: "row",
      marginBottom: 4,
      paddingLeft: 8,
    },
    bulletPoint: {
      fontSize: 16,
      color: theme.colors.text,
      marginRight: 8,
    },
    bulletText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginVertical: 16,
      borderRadius: 8,
      overflow: "hidden",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: isDarkColorScheme ? "#374151" : "#f3f4f6",
    },
    tableRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    tableCell: {
      flex: 1,
      padding: 8,
    },
    tableHeaderText: {
      color: theme.colors.text,
      fontWeight: "bold",
    },
    tableCellText: {
      color: theme.colors.text,
    },
  });

  // Remove the ```mdx and ``` wrapper if present
  const cleanContent = content.replace(/```mdx\n/g, "").replace(/```$/g, "");

  // Split content into lines for processing
  const lines = cleanContent.split("\n");

  // Process the content line by line
  const renderContent = () => {
    const elements: JSX.Element[] = [];
    let inTable = false;
    let tableHeaders: string[] = [];
    let tableRows: string[][] = [];
    let inBulletList = false;
    let bulletItems: JSX.Element[] = [];

    // Helper function to parse inline markdown formatting (**bold**, *italic*)
    function parseInlineFormatting(
      line: string,
      baseStyle: object
    ): JSX.Element {
      const elements: (JSX.Element | string)[] = [];
      // Regex to capture **bold**, *italic*, or plain text segments
      // Handles capturing groups: 1=\*\*, 2=bold content, 3=\*, 4=italic content, 5=plain text
      const regex = /(\*\*)(.*?)\1|(\*)(.*?)\3|([^*]+)/g;
      let match;
      let lastIndex = 0;
      let keyIndex = 0;

      while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0];
        const boldContent = match[2];
        const italicContent = match[4];
        const plainText = match[5];

        // Add plain text before the match if any
        if (match.index > lastIndex) {
          elements.push(
            <Text key={`text-${keyIndex++}`} style={baseStyle}>
              {line.substring(lastIndex, match.index)}
            </Text>
          );
        }

        if (match[1] === "**" && boldContent !== undefined) {
          // Bold
          elements.push(
            <Text
              key={`bold-${keyIndex++}`}
              style={[baseStyle, dynamicStyles.bold]}
            >
              {boldContent}
            </Text>
          );
        } else if (match[3] === "*" && italicContent !== undefined) {
          // Italic
          elements.push(
            <Text
              key={`italic-${keyIndex++}`}
              style={[baseStyle, dynamicStyles.italic, {}]}
            >
              {italicContent}
            </Text>
          );
        } else if (plainText !== undefined) {
          // Plain text segment captured by the regex
          elements.push(plainText);
        }
        // Handle cases like "***" or other uncaptured asterisk patterns as plain text
        else if (fullMatch) {
          elements.push(fullMatch);
        }

        lastIndex = regex.lastIndex;
      }

      // Add any remaining plain text after the last match
      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex));
      }

      // Handle case where the line is empty but shouldn't render an empty Text element unnecessarily
      if (elements.length === 0 && line.trim().length > 0) {
        elements.push(line);
      } else if (
        elements.length === 0 &&
        line.length > 0 &&
        line.trim().length === 0
      ) {
        // If the line is just whitespace, maybe render it or skip based on needs
        // For now, render it to preserve spacing
        elements.push(line);
      }

      return <Text style={baseStyle}>{elements}</Text>;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines entirely, handle list termination before skipping
      if (line.trim() === "") {
        // If we were in a bullet list, add it to elements
        if (inBulletList && bulletItems.length > 0) {
          elements.push(
            <View
              key={`bullet-list-${elements.length}`}
              style={dynamicStyles.bulletList}
            >
              {bulletItems}
            </View>
          );
          inBulletList = false;
          bulletItems = [];
        }
        // If we were in a table, finish it (though Markdown usually needs a blank line *after*)
        // Current table logic handles termination based on non-'|' lines, so this is likely ok.

        continue; // Skip the empty line processing
      }

      // Shared cleanup function for when starting a new block type
      const endBulletListIfNeeded = () => {
        if (inBulletList && bulletItems.length > 0) {
          elements.push(
            <View
              key={`bullet-list-${elements.length}`}
              style={dynamicStyles.bulletList}
            >
              {bulletItems}
            </View>
          );
          inBulletList = false;
          bulletItems = [];
        }
      };

      // Heading 1
      if (line.startsWith("# ")) {
        endBulletListIfNeeded();
        elements.push(
          <Text key={`h1-${i}`} style={dynamicStyles.heading1}>
            {line.substring(2)}
          </Text>
        );
      }
      // Heading 2
      else if (line.startsWith("## ")) {
        endBulletListIfNeeded();
        elements.push(
          <Text key={`h2-${i}`} style={dynamicStyles.heading2}>
            {line.substring(3)}
          </Text>
        );
      }
      // Heading 3
      else if (line.startsWith("### ")) {
        endBulletListIfNeeded();
        elements.push(
          <Text key={`h3-${i}`} style={dynamicStyles.heading3}>
            {line.substring(4)}
          </Text>
        );
      }
      // Bullet list item
      else if (line.startsWith("- ") || line.startsWith("* ")) {
        const bulletText = line.substring(2).trimStart();
        const parsedElement = parseInlineFormatting(
          bulletText,
          dynamicStyles.bulletText
        );

        bulletItems.push(
          <View key={`bullet-item-${i}`} style={dynamicStyles.bulletItem}>
            <Text style={dynamicStyles.bulletPoint}>•</Text>
            <View style={{ flex: 1 }}>{parsedElement}</View>
          </View>
        );

        inBulletList = true;
      }
      // Regular paragraph
      else {
        endBulletListIfNeeded();

        const parsedElement = parseInlineFormatting(
          line,
          dynamicStyles.paragraph
        );
        elements.push(
          React.cloneElement(parsedElement, { key: `paragraph-${i}` })
        );
      }
    }

    // Handle any remaining bullet list
    if (inBulletList && bulletItems.length > 0) {
      elements.push(
        <View key={`bullet-list-final`} style={dynamicStyles.bulletList}>
          {bulletItems}
        </View>
      );
    }

    return elements;
  };

  return <View>{renderContent()}</View>;
};

export default RenderMdx;
