import { Pressable, StyleSheet, Text } from 'react-native';

interface FilterChipProps {
  active?: boolean;
  label: string;
  onPress: () => void;
}

export function FilterChip({ active = false, label, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active ? styles.chipActive : styles.chipInactive,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  chipInactive: {
    backgroundColor: '#FFFFFFCC',
    borderColor: '#DDE5F0',
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelInactive: {
    color: '#334155',
  },
});

export default FilterChip;
