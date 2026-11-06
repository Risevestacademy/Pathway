import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@shared/components/Card";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import type { Career } from "../types";

interface Props {
  career: Career;
  fitLabel: string;
  onPress: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  saveDisabled?: boolean;
}

export function CareerCard({
  career,
  fitLabel,
  onPress,
  isSaved,
  onToggleSave,
  saveDisabled = false,
}: Props) {
  return (
    <Card testID={`career-card-${career.id}`}>
      <View>
        <View style={styles.header}>
          <Text style={styles.badge}>{fitLabel}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaved ? `Unsave ${career.title}` : `Save ${career.title}`}
            accessibilityState={{ disabled: saveDisabled, selected: isSaved }}
            disabled={saveDisabled}
            onPress={onToggleSave}
            hitSlop={8}
            testID={`save-career-${career.id}`}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isSaved ? colors.primary : colors.textTertiary}
            />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${career.title}`}
          onPress={onPress}
        >
          <View style={styles.careerIcon}>
            <Ionicons name="layers-outline" size={23} color={colors.primaryDark} />
          </View>
          <Text style={styles.title}>{career.title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {career.shortDescription}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.skills} numberOfLines={1}>
              Explore career
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primary} />
          </View>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  badge: {
    ...typography.caption,
    color: colors.success,
    backgroundColor: "#D1FAE5",
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: "capitalize",
  },
  careerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { ...typography.sectionTitle, color: colors.text, marginBottom: spacing.xs },
  description: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  skills: { ...typography.bodyMedium, color: colors.textSecondary },
});
