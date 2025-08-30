import { StyleSheet, View, ViewStyle } from 'react-native';
import * as Slot from '@rn-primitives/slot';
import type { SlottableViewProps } from '@rn-primitives/types';
import { TextClassContext } from '~/components/ui/text';

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  default: {
    borderColor: 'transparent',
    backgroundColor: 'var(--primary)',
  },
  secondary: {
    borderColor: 'transparent',
    backgroundColor: 'var(--secondary)',
  },
  destructive: {
    borderColor: 'transparent',
    backgroundColor: 'var(--destructive)',
  },
  outline: {
    borderColor: 'var(--border)',
  },
});

const textStyles = StyleSheet.create({
  base: {
    fontSize: 12,
    fontWeight: '600',
  },
  default: {
    color: 'var(--primary-foreground)',
  },
  secondary: {
    color: 'var(--secondary-foreground)',
  },
  destructive: {
    color: 'var(--destructive-foreground)',
  },
  outline: {
    color: 'var(--foreground)',
  },
});

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps extends SlottableViewProps {
  variant?: BadgeVariant;
  style?: ViewStyle;
}

function Badge({ style, variant = 'default', asChild, ...props }: BadgeProps) {
  const Component = asChild ? Slot.View : View;

  const variantStyle = styles[variant];
  const textVariantStyle = textStyles[variant];

  return (
    <TextClassContext.Provider value={{ style: textVariantStyle }}>
      <Component style={[styles.base, variantStyle, style]} {...props} />
    </TextClassContext.Provider>
  );
}

export { Badge, textStyles as badgeTextVariants, styles as badgeVariants };
export type { BadgeProps };
