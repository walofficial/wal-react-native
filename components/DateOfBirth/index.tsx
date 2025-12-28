import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Control, useController } from 'react-hook-form';
import { Text } from '@/components/ui/text';
import DateTimePicker from '@react-native-community/datetimepicker';
import { parse, format } from 'date-fns';
import { FontSizes, useTheme } from '@/lib/theme';
import { Calendar } from 'lucide-react-native';
import { t } from '@/lib/i18n';

const DEFAULT_DATE = new Date(2000, 1, 1);

interface DateOfBirthProps {
  control: Control<any>;
}

export default function DateOfBirth({ control }: DateOfBirthProps) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const { field } = useController({
    name: 'date_of_birth',
    control,
  });

  const value = field.value;

  const formatDate = (dateString: string) => {
    return parse(dateString, 'dd/MM/yyyy', new Date());
  };

  const formatDateToString = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  const currentDate = new Date();
  const pastDate = new Date(
    currentDate.setFullYear(currentDate.getFullYear() - 12),
  );

  const currentDateValue = value ? formatDate(value) : DEFAULT_DATE;

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      field.onChange(formatDateToString(date));
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.card.background,
            borderColor: theme.colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <View style={styles.innerContainer}>
          <Calendar size={20} color={theme.colors.icon} style={styles.icon} />
          <Text style={[styles.dateText, { color: theme.colors.text }]}>
            {value
              ? formatDateToString(formatDate(value))
              : t('common.date_of_birth')}
          </Text>
        </View>
        <Text style={[styles.actionText, { color: theme.colors.primary }]}>
          {value ? t('common.change') : t('common.select')}
        </Text>
      </Pressable>
      {open &&
        (Platform.OS === 'android' ? (
          <DateTimePicker
            value={currentDateValue}
            mode="date"
            display="default"
            minimumDate={new Date(1940, 1, 1)}
            maximumDate={pastDate}
            onChange={(event, date) => {
              setOpen(false);
              if (event.type === 'set') {
                handleDateChange(date);
              }
            }}
          />
        ) : (
          <DateTimePicker
            value={currentDateValue}
            mode="date"
            display="spinner"
            minimumDate={new Date(1940, 1, 1)}
            maximumDate={pastDate}
            onChange={(_, date) => {
              handleDateChange(date);
            }}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    gap: 12,
    flex: 1,
  },
  button: {
    width: '100%',
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: FontSizes.medium,
    fontWeight: '500',
  },
  actionText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
  },
  pickerContainer: {
    marginTop: 12,
    width: '100%',
  },
  pickerTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
});
