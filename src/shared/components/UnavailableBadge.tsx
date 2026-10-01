import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../design-system/tokens";

/** Explicit "Unavailable" chip — the design forbids showing 0, blank or spinners. */
export function UnavailableBadge() {
  return (
    <View style={styles.badge} testID="unavailable-badge">
      <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
      <Text style={styles.text}>Unavailable</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },
  text: { ...typography.caption, color: colors.textSecondary },
});
