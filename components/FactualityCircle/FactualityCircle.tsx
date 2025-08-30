import { FontSizes } from '@/lib/theme';
import { View, Text, StyleSheet } from 'react-native';
import Svg from 'react-native-svg';
import { Circle } from 'react-native-svg';

function FactualityCircle({
  factuality,
  large,
}: {
  factuality: number;
  large?: boolean;
}) {
  // Default to 0 if factuality is undefined
  const score = factuality ?? 0;

  // Calculate color based on factuality score
  const getScoreColor = () => {
    if (score >= 0.7) return '#22c55e'; // Green for high factuality
    if (score >= 0.4) return '#f59e0b'; // Amber for medium factuality
    return '#ef4444'; // Red for low factuality
  };

  // Get factuality label based on score
  const getFactualityLabel = () => {
    if (score >= 0.7) return 'სანდოა'; // Trustworthy
    if (score >= 0.4) return 'საეჭვოა'; // Questionable
    return 'სიცრუეში შეგიყვანთ'; // Misleading
  };

  const scoreColor = getScoreColor();
  const factualityLabel = getFactualityLabel();

  // Calculate the circle progress
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score);

  // Format score as percentage
  const scorePercentage = `${Math.round(score * 100)}%`;
  if (score <= 0.7) {
    return null;
  }
  return (
    <View style={styles.container}>
      <Text style={[styles.label]}>{factualityLabel}</Text>
      {!large && (
        <Svg width={40} height={40} viewBox="0 0 40 40">
          {/* Background circle */}
          <Circle
            cx={20}
            cy={20}
            r={16}
            stroke="#374151"
            strokeWidth={3}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={20}
            cy={20}
            r={16}
            stroke={scoreColor}
            strokeWidth={3}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90, 20, 20)"
          />
        </Svg>
      )}
      {large && (
        <Text style={[styles.percentage, { color: scoreColor }]}>
          {scorePercentage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 12,
  },
  label: {
    marginRight: 12,
    fontWeight: '600',
    fontSize: FontSizes.medium,
    color: '#ffffff',
  },
  percentage: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: FontSizes.large,
  },
});

export default FactualityCircle;
