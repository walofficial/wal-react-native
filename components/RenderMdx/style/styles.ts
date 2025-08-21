import { ViewStyle, TextStyle, ImageStyle } from "react-native";

// Define types for all possible markdown component styles
export interface MarkdownStyles {
  div?: ViewStyle;
  text?: TextStyle;
  inline?: TextStyle;
  strong?: TextStyle;
  link?: ViewStyle;
  linkLabel?: TextStyle;
  em?: TextStyle;
  headingContainer?: ViewStyle;
  headingBorder?: ViewStyle;
  heading?: TextStyle;
  heading1?: TextStyle;
  heading2?: TextStyle;
  heading3?: TextStyle;
  heading4?: TextStyle;
  heading5?: TextStyle;
  heading6?: TextStyle;
  paragraph?: ViewStyle;
  paragraphText?: TextStyle;
  blockquote?: ViewStyle;
  inlineCode?: TextStyle;
  codeBlock?: TextStyle;
  pre?: ViewStyle;
  list?: ViewStyle;
  listUnordered?: ViewStyle;
  listOrdered?: ViewStyle;
  listUnorderedItem?: ViewStyle;
  listUnorderedItemIcon?: ViewStyle;
  listOrderedItem?: ViewStyle;
  listOrderedItemIcon?: ViewStyle;
  listItem?: TextStyle;
  listItemText?: TextStyle;
  table?: ViewStyle;
  tableHeader?: ViewStyle;
  tableBody?: ViewStyle;
  tableHeaderCell?: ViewStyle;
  tableRow?: ViewStyle;
  tableRowCell?: ViewStyle;
  hr?: ViewStyle;
  img?: ImageStyle;
}

// Default styles - these are fallbacks if NativeWind styles aren't applied
export const styles = (customStyles: MarkdownStyles = {}): MarkdownStyles => {
  return {
    div: {
      ...customStyles.div,
    },
    text: {
      fontSize: 16,
      color: "#333",
      ...customStyles.text,
    },
    inline: {
      ...customStyles.inline,
    },
    strong: {
      fontWeight: "bold",
      ...customStyles.strong,
    },
    link: {
      ...customStyles.link,
    },
    linkLabel: {
      color: "#0366d6",
      textDecorationLine: "underline",
      ...customStyles.linkLabel,
    },
    em: {
      fontStyle: "italic",
      ...customStyles.em,
    },
    headingContainer: {
      marginTop: 16,
      marginBottom: 8,
      ...customStyles.headingContainer,
    },
    headingBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "#eaecef",
      paddingBottom: 4,
      ...customStyles.headingBorder,
    },
    heading: {
      fontWeight: "bold",
      color: "#24292e",
      ...customStyles.heading,
    },
    heading1: {
      fontSize: 28,
      ...customStyles.heading1,
    },
    heading2: {
      fontSize: 24,
      ...customStyles.heading2,
    },
    heading3: {
      fontSize: 20,
      ...customStyles.heading3,
    },
    heading4: {
      fontSize: 18,
      ...customStyles.heading4,
    },
    heading5: {
      fontSize: 16,
      ...customStyles.heading5,
    },
    heading6: {
      fontSize: 14,
      ...customStyles.heading6,
    },
    paragraph: {
      marginTop: 8,
      marginBottom: 16,
      ...customStyles.paragraph,
    },
    paragraphText: {
      ...customStyles.paragraphText,
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: "#dfe2e5",
      paddingLeft: 16,
      paddingVertical: 8,
      marginVertical: 16,
      backgroundColor: "#f6f8fa",
      ...customStyles.blockquote,
    },
    inlineCode: {
      fontFamily: "monospace",
      backgroundColor: "#f6f8fa",
      padding: 2,
      borderRadius: 3,
      ...customStyles.inlineCode,
    },
    codeBlock: {
      fontFamily: "monospace",
      ...customStyles.codeBlock,
    },
    pre: {
      backgroundColor: "#f6f8fa",
      padding: 16,
      marginVertical: 16,
      borderRadius: 6,
      overflow: "scroll",
      ...customStyles.pre,
    },
    list: {
      marginVertical: 16,
      paddingLeft: 8,
      ...customStyles.list,
    },
    listUnordered: {
      ...customStyles.listUnordered,
    },
    listOrdered: {
      ...customStyles.listOrdered,
    },
    listUnorderedItem: {
      flexDirection: "row",
      marginBottom: 8,
      ...customStyles.listUnorderedItem,
    },
    listUnorderedItemIcon: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#24292e",
      marginTop: 8,
      marginRight: 8,
      ...customStyles.listUnorderedItemIcon,
    },
    listOrderedItem: {
      flexDirection: "row",
      marginBottom: 8,
      ...customStyles.listOrderedItem,
    },
    listOrderedItemIcon: {
      marginRight: 8,
      ...customStyles.listOrderedItemIcon,
    },
    listItem: {
      flex: 1,
      ...customStyles.listItem,
    },
    listItemText: {
      ...customStyles.listItemText,
    },
    table: {
      borderWidth: 1,
      borderColor: "#dfe2e5",
      borderRadius: 6,
      marginVertical: 16,
      overflow: "hidden",
      ...customStyles.table,
    },
    tableHeader: {
      backgroundColor: "#f6f8fa",
      ...customStyles.tableHeader,
    },
    tableBody: {
      ...customStyles.tableBody,
    },
    tableHeaderCell: {
      padding: 8,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#dfe2e5",
      ...customStyles.tableHeaderCell,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderColor: "#dfe2e5",
      ...customStyles.tableRow,
    },
    tableRowCell: {
      padding: 8,
      borderRightWidth: 1,
      borderColor: "#dfe2e5",
      ...customStyles.tableRowCell,
    },
    hr: {
      height: 1,
      backgroundColor: "#e1e4e8",
      marginVertical: 16,
      ...customStyles.hr,
    },
    img: {
      width: "100%",
      height: 200,
      borderRadius: 6,
      marginVertical: 16,
      ...customStyles.img,
    },
  };
};
