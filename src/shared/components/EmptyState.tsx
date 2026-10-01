import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../design-system/tokens";

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  testID?: string;
}

export function EmptyState({ icon, title, message, testID }: Props) {
  return (
    <View style={styles.wrap} testID={testID}>
      <Ionicons name={icon} size={36} color={colors.primary} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: spacing.xxxl, gap: spacing.md },
  title: { ...typography.sectionTitle, color: colors.text, textAlign: "center" },
  message: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
});
