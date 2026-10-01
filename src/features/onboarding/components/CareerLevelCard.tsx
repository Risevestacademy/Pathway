import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import type { CareerLevel } from "@shared/types/domain";

interface Props {
  level: CareerLevel;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onSelect: (level: CareerLevel) => void;
  testID?: string;
}

export function CareerLevelCard({
  level,
  title,
  description,
  icon,
  selected,
  onSelect,
  testID,
}: Props) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      onPress={() => onSelect(level)}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons name={icon} size={20} color={selected ? colors.surface : colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
      ) : (
        <View style={styles.emptyCircle} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSelected: { backgroundColor: colors.primary },
  textWrap: { flex: 1 },
  title: { ...typography.bodyMedium, color: colors.text, marginBottom: 2 },
  description: { ...typography.caption, color: colors.textSecondary },
  emptyCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
});
