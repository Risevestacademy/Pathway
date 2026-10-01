import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "./PrimaryButton";
import { colors, spacing, typography } from "../design-system/tokens";

interface Props {
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorState({ title, message, retryLabel = "Try again", onRetry, testID }: Props) {
  return (
    <View style={styles.wrap} testID={testID ?? "error-state"}>
      <Ionicons name="warning-outline" size={34} color={colors.danger} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? (
        <View style={styles.buttonWrap}>
          <PrimaryButton title={retryLabel} onPress={onRetry} testID="retry-button" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: spacing.xxxl, gap: spacing.md, paddingHorizontal: spacing.lg },
  title: { ...typography.sectionTitle, color: colors.text, textAlign: "center" },
  message: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  buttonWrap: { alignSelf: "stretch", marginTop: spacing.sm },
});
