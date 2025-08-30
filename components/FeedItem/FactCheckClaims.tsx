import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react-native';

interface Claim {
  id: string;
  statement: string;
  verdict: string;
  reason: string;
}

interface FactCheckClaimsProps {
  claims: Claim[];
}

const FactCheckClaims = ({ claims }: FactCheckClaimsProps) => {
  const getVerdictIcon = (verdict: string) => {
    const verdictLower = verdict.toLowerCase();

    if (verdictLower.includes('true')) {
      return <CheckCircle size={16} color="#22c55e" />;
    } else if (verdictLower.includes('false')) {
      return <AlertCircle size={16} color="#ef4444" />;
    } else {
      return <HelpCircle size={16} color="#f59e0b" />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    const verdictLower = verdict.toLowerCase();

    if (verdictLower.includes('true')) {
      return '#22c55e'; // green
    } else if (verdictLower.includes('false')) {
      return '#ef4444'; // red
    } else {
      return '#f59e0b'; // amber
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Claims Analysis:</Text>

      {claims.map((claim) => (
        <View key={claim.id} style={styles.claimContainer}>
          <View style={styles.claimContent}>
            <View style={styles.iconContainer}>
              {getVerdictIcon(claim.verdict)}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.statement}>{claim.statement}</Text>
              <View
                style={[
                  styles.verdictContainer,
                  { backgroundColor: `${getVerdictColor(claim.verdict)}30` },
                ]}
              >
                <Text
                  style={[
                    styles.verdictText,
                    { color: getVerdictColor(claim.verdict) },
                  ]}
                >
                  {claim.verdict}
                </Text>
              </View>
              <Text style={styles.reason}>{claim.reason}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 12,
  },
  claimContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(55, 65, 81, 0.5)',
  },
  claimContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginTop: 4,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  statement: {
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 4,
  },
  verdictContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  verdictText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reason: {
    color: '#D1D5DB',
    fontSize: 14,
  },
});

export default FactCheckClaims;
