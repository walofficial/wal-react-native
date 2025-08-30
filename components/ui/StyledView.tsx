import * as React from 'react';
import { View, StyleSheet, ViewStyle, ViewProps } from 'react-native';
import { colors, spacing, borderRadius } from '@/utils/styleUtils';

export interface StyledViewProps extends ViewProps {
  padding?: keyof typeof spacing;
  paddingHorizontal?: keyof typeof spacing;
  paddingVertical?: keyof typeof spacing;
  margin?: keyof typeof spacing;
  marginHorizontal?: keyof typeof spacing;
  marginVertical?: keyof typeof spacing;
  rounded?: keyof typeof borderRadius | boolean;
  backgroundColor?: string;
  flex?: boolean | number;
  direction?: 'row' | 'column';
  justify?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  border?: boolean;
  borderColor?: string;
  shadow?: boolean;
}

export const StyledView: React.FC<StyledViewProps> = ({
  padding,
  paddingHorizontal,
  paddingVertical,
  margin,
  marginHorizontal,
  marginVertical,
  rounded,
  backgroundColor,
  flex,
  direction,
  justify,
  align,
  border,
  borderColor,
  shadow,
  style,
  children,
  ...props
}) => {
  const viewStyle: ViewStyle = {
    ...(padding !== undefined && { padding: spacing[padding] }),
    ...(paddingHorizontal !== undefined && {
      paddingHorizontal: spacing[paddingHorizontal],
    }),
    ...(paddingVertical !== undefined && {
      paddingVertical: spacing[paddingVertical],
    }),
    ...(margin !== undefined && { margin: spacing[margin] }),
    ...(marginHorizontal !== undefined && {
      marginHorizontal: spacing[marginHorizontal],
    }),
    ...(marginVertical !== undefined && {
      marginVertical: spacing[marginVertical],
    }),
    ...(rounded === true && { borderRadius: borderRadius.DEFAULT }),
    ...(rounded &&
      typeof rounded !== 'boolean' && { borderRadius: borderRadius[rounded] }),
    ...(backgroundColor && { backgroundColor }),
    ...(flex === true && { flex: 1 }),
    ...(typeof flex === 'number' && { flex }),
    ...(direction && { flexDirection: direction }),
    ...(justify && { justifyContent: justify }),
    ...(align && { alignItems: align }),
    ...(border && { borderWidth: 1, borderColor: borderColor || colors.input }),
    ...(shadow && styles.shadow),
  };

  return (
    <View style={[viewStyle, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default StyledView;
