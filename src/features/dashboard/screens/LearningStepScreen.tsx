import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "@features/auth/context/AuthContext";
import type { RootStackParamList } from "@app/navigation/types";
import { ApiRequestError } from "@shared/api/client";
import { PrimaryButton } from "@shared/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import { DashboardScreenFrame } from "../components/DashboardScreenFrame";
import { usePathwayStepDetails } from "../hooks/useDashboardQueries";
import { navigateToDashboardTab } from "../navigation";
import { updatePathwayStepStatus } from "../api/dashboardMutations";

type Props = NativeStackScreenProps<RootStackParamList, "LearningStep">;

function getUpdateError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) {
      return "Save this career to your pathways before updating its steps.";
    }
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    if (error.kind === "network") {
      return "Unable to connect. Check your internet connection and try again.";
    }
  }
  return "We couldn't update this step. Please try again.";
}

export function LearningStepScreen({ navigation, route }: Props) {
  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : "anonymous";
  const query = usePathwayStepDetails(route.params.stepId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const updateStatus = async (status: "COMPLETED" | "NOT_STARTED") => {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await updatePathwayStepStatus(userId, route.params.stepId, status);
    } catch (error) {
      setUpdateError(getUpdateError(error));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardScreenFrame
      activeTab="Pathway"
      onSelectTab={(tab) => navigateToDashboardTab(navigation, tab)}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹ Your pathway</Text>
        </Pressable>
        {query.status === "loading" ? (
          <View style={styles.status}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.body}>Loading learning step…</Text>
          </View>
        ) : query.status === "error" ? (
          <View style={styles.status}>
            <Text style={styles.error}>{query.errorMessage}</Text>
            <Pressable accessibilityRole="button" onPress={() => void query.retry()}>
              <Text style={styles.link}>Try again</Text>
            </Pressable>
          </View>
        ) : query.data ? (
          <View style={styles.details}>
            <Text style={styles.order}>LESSON {query.data.order}</Text>
            <Text style={styles.title}>{query.data.title}</Text>
            {query.data.description ? (
              <Text style={styles.body}>{query.data.description}</Text>
            ) : null}
            <DetailSection title="Learning objective" text={query.data.learningObjective} />
            {query.data.prerequisites ? (
              <DetailSection title="Prerequisites" text={query.data.prerequisites} />
            ) : null}
            <DetailSection title="Expected activity" text={query.data.expectedActivity} />
            {query.data.skills.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <Text style={styles.body}>
                  {query.data.skills.map((skill) => skill.name).join(" · ")}
                </Text>
              </View>
            ) : null}
            {query.data.resources.map((resource) => (
              <View key={resource.id} style={styles.resource}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.body}>
                  {resource.provider} · {resource.costStatus.toLowerCase()}
                </Text>
                {resource.description ? (
                  <Text style={styles.body}>{resource.description}</Text>
                ) : null}
                <Pressable
                  accessibilityRole="link"
                  onPress={() => {
                    void Linking.openURL(resource.url).catch(() => {
                      setUpdateError("This learning resource couldn't be opened.");
                    });
                  }}
                >
                  <Text style={styles.link}>Open resource</Text>
                </Pressable>
              </View>
            ))}
            {updateError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {updateError}
              </Text>
            ) : null}
            <PrimaryButton
              title={isUpdating ? "Updating…" : "Mark complete"}
              onPress={() => void updateStatus("COMPLETED")}
              disabled={isUpdating}
            />
            <Pressable
              accessibilityRole="button"
              disabled={isUpdating}
              onPress={() => void updateStatus("NOT_STARTED")}
              style={styles.resetButton}
            >
              <Text style={styles.link}>Mark as not started</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </DashboardScreenFrame>
  );
}

function DetailSection({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  details: { gap: spacing.lg },
  back: { ...typography.bodyMedium, color: colors.primary },
  order: { ...typography.caption, color: colors.primary, letterSpacing: 1 },
  title: { ...typography.title, color: colors.text },
  section: { gap: spacing.xs },
  sectionTitle: { ...typography.sectionTitle, color: colors.text },
  body: { ...typography.body, color: colors.textSecondary },
  status: { minHeight: 180, justifyContent: "center", alignItems: "center", gap: spacing.md },
  error: { ...typography.body, color: colors.danger, textAlign: "center" },
  link: { ...typography.bodyMedium, color: colors.primary },
  resource: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  resourceTitle: { ...typography.bodyMedium, color: colors.text },
  resetButton: { alignItems: "center", padding: spacing.sm },
});
