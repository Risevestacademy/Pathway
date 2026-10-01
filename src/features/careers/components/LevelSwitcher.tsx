import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { CAREER_LEVEL_LABELS } from "@shared/types/domain";
import type { CareerLevel } from "@shared/types/domain";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";

interface Props {
  selected: CareerLevel;
  onSelect: (level: CareerLevel) => void;
}

const LEVELS: CareerLevel[] = ["STUDENT", "RECENT_GRAD", "EARLY_CAREER"];

/** Always visible per design; horizontal scroll on narrow screens. */
export function LevelSwitcher({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID="level-switcher"
    >
      {LEVELS.map((level) => {
        const isSelected = level === selected;
        return (
          <Pressable
            key={level}
            testID={`switcher-${level}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(level)}
            style={[styles.pill, isSelected && styles.pillSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {CAREER_LEVEL_LABELS[level]}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingBottom: spacing.lg },
  pill: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pillSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { ...typography.bodyMedium, color: colors.text },
  labelSelected: { color: colors.surface },
});
