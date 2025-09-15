import React, { Fragment } from 'react';
import { ScrollView, Text } from 'react-native';
import { useMarkdown, type useMarkdownHookOptions } from 'react-native-marked';
import { useTheme } from '@/lib/theme';
import { useColorScheme } from '@/lib/useColorScheme';
interface RenderMdxProps {
  content: string;
}

const RenderMdx: React.FC<RenderMdxProps> = ({ content }) => {
  const theme = useTheme();
  const { isDarkColorScheme } = useColorScheme();

  // Clean the content by removing any MDX wrapper syntax if present
  const cleanContent = content;

  const options: useMarkdownHookOptions = {
    colorScheme: isDarkColorScheme ? 'dark' : 'light',
    theme: {
      colors: {
        text: theme.colors.text,
        background: 'transparent',
        border: 'transparent',
        link: theme.colors.primary || '#007AFF',
        code: isDarkColorScheme ? '#374151' : '#f3f4f6',
      },
    },
  };

  const elements = useMarkdown(cleanContent, options);

  const withTextNotSelectable = (node: React.ReactNode): React.ReactNode => {
    if (!React.isValidElement(node)) {
      return node;
    }

    const element = node as React.ReactElement<any>;
    const { children, ...restProps } = element.props ?? {};

    const processedChildren = React.Children.map(children, (child) =>
      withTextNotSelectable(child),
    );

    if (element.type === Text) {
      return React.cloneElement(
        element,
        { ...restProps, selectable: false },
        processedChildren,
      );
    }

    return React.cloneElement(element, restProps, processedChildren);
  };

  return (
    <ScrollView>
      {elements.map((element, index) => {
        return (
          <Fragment key={`mdx_${index}`}>
            {withTextNotSelectable(element)}
          </Fragment>
        );
      })}
    </ScrollView>
  );
};

export default RenderMdx;
