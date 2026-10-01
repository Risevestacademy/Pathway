import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@shared/components/Card";
import { colors, spacing, typography } from "@shared/design-system/tokens";
import type { Career } from "../types";

interface Props {
  career: Career;
  fitLabel: string;
  onPress: () => void;
}

export function CareerCard({ career, fitLabel, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${career.title}`}
      onPress={onPress}
    >
      <Card testID={`career-card-${career.id}`}>
        <Text style={styles.badge}>🎉 Good fit for {fitLabel}</Text>
        <Text style={styles.title}>{career.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {career.shortDescription}
        </Text>
        <View style={styles.linkRow}>
          <Text style={styles.link}>View career</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primaryDark} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  title: { ...typography.sectionTitle, color: colors.text, marginBottom: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  link: { ...typography.bodyMedium, color: colors.primaryDark },
});
