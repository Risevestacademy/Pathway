import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SkillDto } from "@features/careers/api/dtos";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";

interface Props {
  skills: SkillDto[];
  selectedSkills: string[];
  loading: boolean;
  error: string | null;
  onToggle: (name: string) => void;
  onRetry: () => void;
}

export function SkillSelector({
  skills,
  selectedSkills,
  loading,
  error,
  onToggle,
  onRetry,
}: Props) {
  if (loading) {
    return (
      <View style={styles.status} testID="skills-loading">
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.statusText}>Loading skills…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.error} testID="skills-error">
        <Text style={styles.errorText}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} testID="skills-retry-button">
          <Text style={styles.retry}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (skills.length === 0) {
    return <Text style={styles.statusText}>No skills are available right now.</Text>;
  }

  return (
    <View style={styles.grid}>
      {skills.map((skill) => {
        const selected = selectedSkills.includes(skill.name);
        return (
          <Pressable
            key={skill.id}
            testID={`skill-${skill.id}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            onPress={() => onToggle(skill.name)}
            style={styles.skill}
          >
            <View style={[styles.indicator, selected && styles.indicatorSelected]}>
              {selected ? <Ionicons name="checkmark" size={11} color={colors.primary} /> : null}
            </View>
            <Text style={styles.skillName}>{skill.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    rowGap: spacing.md,
  },
  skill: {
    width: "33.333%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  indicator: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  skillName: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  status: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  statusText: { ...typography.caption, color: colors.textSecondary },
  error: { gap: spacing.xs, paddingVertical: spacing.sm },
  errorText: { ...typography.caption, color: colors.danger },
  retry: { ...typography.caption, color: colors.primary, fontWeight: "600" },
});
