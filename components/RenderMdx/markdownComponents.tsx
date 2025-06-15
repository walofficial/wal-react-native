import React, {
  Children,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TextProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import {
  MarkdownStyles,
  styles as defaultMarkdownStyles,
} from "./style/styles";
import { FontSizes, useTheme } from "@/lib/theme";
import { useColorScheme } from "@/lib/useColorScheme";

// Helper function to wrap string children with Text components
function wrapChildren(children: ReactNode, textProps: TextProps): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" ? <Text {...textProps}>{child}</Text> : child
  );
}

// Context for managing list items
const ListStyleContext = React.createContext<{
  style: string;
  getIndex?: () => number;
}>({
  style: "unordered",
  getIndex: () => 0,
});

// Function to open URLs
const openUrl = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.log(`Cannot open URL: ${url}`);
    }
  } catch (error) {
    console.error("Error opening URL:", error);
  }
};

// Define common prop types for component props
interface ComponentProps {
  children?: ReactNode;
}

interface IndexProps extends ComponentProps {
  index?: number;
}

interface FirstOfTypeProps extends ComponentProps {
  firstOfType?: boolean;
}

interface HrefProps extends ComponentProps {
  href?: string;
}

interface ImgProps extends ComponentProps {
  src?: string;
  alt?: string;
}

// Additional styles for components not covered in MarkdownStyles
interface ExtendedStyles {
  container: ViewStyle;
  inline: TextStyle;
  linkText: TextStyle;
  italic: TextStyle;
  heading1Container: ViewStyle;
  heading2Container: ViewStyle;
  heading3Container: ViewStyle;
  heading4Container: ViewStyle;
  heading5Container: ViewStyle;
  heading6Container: ViewStyle;
  noTopMargin: ViewStyle;
  mt2: ViewStyle;
  mt5: ViewStyle;
  blockquoteText: TextStyle;
  code: TextStyle;
  pre: ViewStyle;
  bullet: ViewStyle;
  numberContainer: ViewStyle;
  listItemContent: ViewStyle;
  tableHeaderText: TextStyle;
  tableCell: ViewStyle;
  imageContainer: ViewStyle;
  image: ImageStyle;
}

const components = (markdownStyles: MarkdownStyles = {}) => {
  // Get theme colors
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  // Merge default styles with custom styles and extended styles
  const baseStyles = defaultMarkdownStyles(markdownStyles);
  const combinedStyles = StyleSheet.create({
    ...StyleSheet.flatten(baseStyles),
    container: {
      flex: 1,
    },
    inline: {
      flexDirection: "row",
    },
    linkText: {
      fontSize: 16,
      color: theme.colors.primary,
      textDecorationLine: "underline",
    },
    italic: {
      fontSize: 16,
      fontStyle: "italic",
      color: theme.colors.text,
    },
    heading1Container: {
      marginTop: 24,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 4,
    },
    heading2Container: {
      marginTop: 20,
      marginBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom: 4,
    },
    heading3Container: {
      marginTop: 16,
      marginBottom: 8,
    },
    heading4Container: {
      marginTop: 12,
      marginBottom: 4,
    },
    heading5Container: {
      marginTop: 8,
      marginBottom: 4,
    },
    heading6Container: {
      marginTop: 8,
      marginBottom: 4,
    },
    noTopMargin: {
      marginTop: 0,
    },
    mt2: {
      marginTop: 8,
    },
    mt5: {
      marginTop: 20,
    },
    blockquoteText: {
      fontSize: 16,
      color: theme.colors.secondary,
    },
    code: {
      fontSize: 14,
      fontFamily: "monospace",
      color: theme.colors.text,
    },
    pre: {
      padding: 16,
      marginVertical: 16,
      backgroundColor: isDarkColorScheme ? "#333" : "#F3F4F6",
      borderRadius: 4,
    },
    bullet: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.text,
      marginTop: 8,
      marginRight: 8,
    },
    numberContainer: {
      marginRight: 8,
    },
    listItemContent: {
      flex: 1,
    },
    tableHeaderText: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.colors.text,
    },
    tableCell: {
      padding: 8,
      borderRightWidth: 1,
      borderColor: theme.colors.border,
    },
    imageContainer: {
      marginVertical: 16,
    },
    image: {
      width: "100%",
      height: 192,
      borderRadius: 4,
    },
  }) as ExtendedStyles & MarkdownStyles;

  return {
    div: ({ children }: ComponentProps) => {
      return <View style={combinedStyles.container}>{children}</View>;
    },
    wrapper: ({ children }: ComponentProps) => {
      let prevChildTypes = ["root"];
      const childrenCount = Children.count(children);

      return Children.map(children, (child, index) => {
        if (typeof child === "string") {
          return child;
        }

        // @ts-ignore - We need to access props of React elements
        const prevSibling = prevChildTypes[prevChildTypes.length - 1];
        // @ts-ignore - We need to access props of React elements
        const mdxType = child.props.mdxType || "element";
        const isFirstOfType =
          prevChildTypes[prevChildTypes.length - 1] !== mdxType;

        prevChildTypes.push(mdxType);

        return React.cloneElement(
          // @ts-ignore - We need to clone React elements
          child,
          {
            // @ts-ignore - We need to access props of React elements
            ...child.props,
            index,
            firstChild: index === 0,
            lastChild: index === childrenCount - 1,
            firstOfType: isFirstOfType,
            prevSibling: prevSibling,
          },
          // @ts-ignore - We need to access props of React elements
          child.props.children
        );
      });
    },
    textgroup: ({ children }: ComponentProps) => {
      return <Text style={{...combinedStyles.text, color: theme.colors.text}}>{children}</Text>;
    },
    inline: ({ children }: ComponentProps) => {
      return (
        <Text style={[combinedStyles.text, combinedStyles.inline, { color: theme.colors.text }]}>
          {children}
        </Text>
      );
    },
    text: ({ children }: ComponentProps) => {
      return <Text style={{...combinedStyles.text, color: theme.colors.text}}>{children}</Text>;
    },
    span: ({ children }: ComponentProps) => {
      return <Text style={{...combinedStyles.text, color: theme.colors.text}}>{children}</Text>;
    },
    strong: ({ children }: ComponentProps) => {
      return <Text style={{...combinedStyles.strong, color: theme.colors.text}}>{children}</Text>;
    },
    a: ({ href, children }: HrefProps) => {
      return (
        <TouchableOpacity
          style={combinedStyles.link}
          onPress={() => href && openUrl(href)}
        >
          <Text style={combinedStyles.linkText}>{children}</Text>
        </TouchableOpacity>
      );
    },
    em: ({ children }: ComponentProps) => {
      return <Text style={combinedStyles.italic}>{children}</Text>;
    },
    h1: ({ children, index }: IndexProps) => {
      const isFirst = index === 0;
      return (
        <View
          style={[
            combinedStyles.heading1Container,
            isFirst && combinedStyles.noTopMargin,
          ]}
        >
          <Text style={{...combinedStyles.heading1, color: theme.colors.text}}>{children}</Text>
        </View>
      );
    },
    h2: ({ children, index }: IndexProps) => {
      const isFirst = index === 0;
      return (
        <View
          style={[
            combinedStyles.heading2Container,
            isFirst && combinedStyles.noTopMargin,
          ]}
        >
          <Text style={{...combinedStyles.heading2, color: theme.colors.text}}>{children}</Text>
        </View>
      );
    },
    h3: ({ children, index }: IndexProps) => {
      const isFirst = index === 0;
      return (
        <View
          style={[
            combinedStyles.heading3Container,
            isFirst && combinedStyles.noTopMargin,
          ]}
        >
          <Text style={{...combinedStyles.heading3, color: theme.colors.text}}>{children}</Text>
        </View>
      );
    },
    h4: ({ children, index }: IndexProps) => {
      const isFirst = index === 0;
      return (
        <View
          style={[
            combinedStyles.heading4Container,
            isFirst && combinedStyles.noTopMargin,
          ]}
        >
          <Text style={{...combinedStyles.heading4, color: theme.colors.text}}>{children}</Text>
        </View>
      );
    },
    h5: ({ children }: ComponentProps) => {
      return (
        <View style={combinedStyles.heading5Container}>
          <Text style={{...combinedStyles.heading5, color: theme.colors.text}}>{children}</Text>
        </View>
      );
    },
    h6: ({ children }: ComponentProps) => {
      return (
        <View style={combinedStyles.heading6Container}>
          <Text style={{...combinedStyles.heading6, color: theme.colors.text}}>{children}</Text>
        </View>
      );
    },
    p: ({ children, index }: IndexProps) => {
      const isFirst = index === 0;
      return (
        <View
          style={[
            combinedStyles.paragraph,
            isFirst ? combinedStyles.noTopMargin : combinedStyles.mt2,
          ]}
        >
          <Text style={{...combinedStyles.text, color: theme.colors.text}}>
            {wrapChildren(children, { style: {...combinedStyles.text, color: theme.colors.text} })}
          </Text>
        </View>
      );
    },
    blockquote: ({ children, firstOfType }: FirstOfTypeProps) => {
      const wrappedChildren = wrapChildren(children, {
        style: combinedStyles.blockquoteText,
      });
      return (
        <View
          style={[
            {...combinedStyles.blockquote, borderLeftColor: theme.colors.border, backgroundColor: isDarkColorScheme ? "#222" : "#F3F4F6"}, 
            firstOfType && combinedStyles.mt5
          ]}
        >
          {wrappedChildren}
        </View>
      );
    },
    inlineCode: ({ children }: ComponentProps) => {
      return <Text style={{...combinedStyles.inlineCode, color: theme.colors.text, backgroundColor: isDarkColorScheme ? "#333" : "#F3F4F6"}}>{children}</Text>;
    },
    code: ({ children }: ComponentProps) => {
      return <Text style={combinedStyles.code}>{children}</Text>;
    },
    pre: ({ children }: ComponentProps) => {
      return <View style={combinedStyles.pre}>{children}</View>;
    },
    ul: ({ children }: ComponentProps) => {
      return (
        <View style={combinedStyles.list}>
          <ListStyleContext.Provider
            value={{ style: "unordered", getIndex: () => 0 }}
          >
            {children}
          </ListStyleContext.Provider>
        </View>
      );
    },
    ol: ({ children }: ComponentProps) => {
      const itemIndex = useRef(0);
      const getItemIndex = useCallback(() => ++itemIndex.current, []);

      return (
        <View style={combinedStyles.list}>
          <ListStyleContext.Provider
            value={{ style: "ordered", getIndex: getItemIndex }}
          >
            {children}
          </ListStyleContext.Provider>
        </View>
      );
    },
    li: ({ children }: ComponentProps) => {
      const { style, getIndex = () => 0 } = useContext(ListStyleContext);

      return (
        <View style={{ flexDirection: "row", marginBottom: 8 }}>
          {style === "unordered" ? (
            <View style={combinedStyles.bullet} />
          ) : (
            <View style={combinedStyles.numberContainer}>
              <Text style={{...combinedStyles.text, color: theme.colors.text}}>{getIndex()}.</Text>
            </View>
          )}
          <View style={combinedStyles.listItemContent}>
            <Text style={{...combinedStyles.text, color: theme.colors.text}}>{children}</Text>
          </View>
        </View>
      );
    },
    table: ({ children }: ComponentProps) => {
      return <View style={{...combinedStyles.table, borderColor: theme.colors.border}}>{children}</View>;
    },
    thead: ({ children }: ComponentProps) => {
      return <View style={{...combinedStyles.tableHeader, backgroundColor: isDarkColorScheme ? "#333" : "#F3F4F6"}}>{children}</View>;
    },
    tbody: ({ children }: ComponentProps) => {
      return <View>{children}</View>;
    },
    th: ({ children }: ComponentProps) => {
      return (
        <View style={{...combinedStyles.tableHeaderCell, borderColor: theme.colors.border}}>
          <Text style={combinedStyles.tableHeaderText}>{children}</Text>
        </View>
      );
    },
    tr: ({ children }: ComponentProps) => {
      return <View style={{...combinedStyles.tableRow, borderColor: theme.colors.border}}>{children}</View>;
    },
    td: ({ children }: ComponentProps) => {
      return (
        <View style={combinedStyles.tableCell}>
          <Text style={{...combinedStyles.text, color: theme.colors.text}}>{children}</Text>
        </View>
      );
    },
    hr: () => {
      return <View style={{...combinedStyles.hr, backgroundColor: theme.colors.border}} />;
    },
    br: () => <Text>{"\n"}</Text>,
    img: ({ src, alt }: ImgProps) => {
      return (
        <View style={combinedStyles.imageContainer}>
          <Image
            style={combinedStyles.image}
            source={{ uri: src }}
            contentFit="cover"
            alt={alt || "Image"}
          />
        </View>
      );
    },
    b: ({ children }: ComponentProps) => {
      // Added explicit 'b' tag support as an alternative to 'strong'
      return <Text style={{...combinedStyles.strong, color: theme.colors.text}}>{children}</Text>;
    },
  };
};

export default components;
