import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@shared/design-system/tokens";

interface Props {
  tags: string[];
  onEdit: () => void;
  onClear: () => void;
}

export function FilterBanner({ tags, onEdit, onClear }: Props) {
  if (tags.length === 0) return null;
  return (
    <View style={styles.banner} testID="filter-banner">
      <View style={styles.left}>
        <Ionicons name="options-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.text}>Showing matches for</Text>
        <Text style={styles.tags}>{tags.join(", ")}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onEdit} hitSlop={8}>
          <Text style={styles.action}>Edit</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8} testID="clear-link">
          <Text style={styles.action}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  left: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm, flex: 1 },
  text: { ...typography.caption, color: colors.textSecondary },
  tags: { ...typography.caption, color: colors.text },
  actions: { flexDirection: "row", gap: spacing.lg },
  action: { ...typography.caption, color: colors.primaryDark },
});
