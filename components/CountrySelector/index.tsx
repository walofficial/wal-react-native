import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { Text } from '@/components/ui/text';
import { getSortedCountries, Country, getFlagUrl } from '@/lib/countries';
import { ChevronLeft } from 'lucide-react-native';
import { FontSizes } from '@/lib/theme';

interface CountrySelectorProps {
  onSelectCountry: (country: Country) => void;
  onBack: () => void;
  selectedCountry?: Country;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  onSelectCountry,
  onBack,
  selectedCountry,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const sortedCountries = getSortedCountries();

  const handleCountrySelect = (country: Country) => {
    onSelectCountry(country);
    onBack();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? '#333' : '#e0e0e0' },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: isDark ? 'white' : 'black' }]}
        >
          აირჩიეთ ქვეყანა
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Countries List */}
      <BottomSheetScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortedCountries.map((country) => (
          <TouchableOpacity
            key={country.code}
            style={[
              styles.countryItem,
              { borderBottomColor: isDark ? '#333' : '#f0f0f0' },
              selectedCountry?.code === country.code && {
                backgroundColor: isDark ? '#333' : '#f0f0f0',
              },
            ]}
            onPress={() => handleCountrySelect(country)}
          >
            <View style={styles.countryInfo}>
              <Image
                source={{ uri: getFlagUrl(country.flag) }}
                style={styles.flag}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.countryText}>
                <Text
                  style={[
                    styles.countryName,
                    { color: isDark ? 'white' : 'black' },
                  ]}
                >
                  {country.nameGeo}
                </Text>
                <Text
                  style={[
                    styles.countryEnglishName,
                    { color: isDark ? '#ccc' : '#666' },
                  ]}
                >
                  {country.name}
                </Text>
              </View>
            </View>
            <Text
              style={[styles.callingCode, { color: isDark ? '#ccc' : '#666' }]}
            >
              {country.callingCode}
            </Text>
          </TouchableOpacity>
        ))}
      </BottomSheetScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginHorizontal: -16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: FontSizes.large,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    marginHorizontal: -24,
    marginTop: 24,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 24,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    width: 32,
    height: 24,
    borderRadius: 4,
    marginRight: 12,
  },
  countryText: {
    flex: 1,
  },
  countryName: {
    fontSize: FontSizes.medium,
    fontWeight: '500',
  },
  countryEnglishName: {
    fontSize: FontSizes.small,
    marginTop: 2,
  },
  callingCode: {
    fontSize: FontSizes.medium,
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default CountrySelector;
