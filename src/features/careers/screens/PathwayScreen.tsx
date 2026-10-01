import React, { useEffect } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePostHog } from "posthog-react-native";
import { ScreenContainer } from "@shared/components/ScreenContainer";
import { Card } from "@shared/components/Card";
import { CatalogueSkeleton } from "@shared/components/CatalogueSkeleton";
import { EmptyState } from "@shared/components/EmptyState";
import { ErrorState } from "@shared/components/ErrorState";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import type { RootStackParamList } from "@app/navigation/types";
import { useCareersStore } from "../store/careersStore";

type Props = NativeStackScreenProps<RootStackParamList, "Pathway">;

/** Simple pathway screen built from the API schema (no final design yet). */
export function PathwayScreen({ route }: Props) {
  const posthog = usePostHog();
  const { careerId } = route.params;
  const { pathway, pathwayStatus, loadPathway } = useCareersStore();

  useEffect(() => {
    void loadPathway(careerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerId]);

  useEffect(() => {
    if (pathwayStatus === "error") {
      posthog.logger.error("career roadmap request failed", {
        career_id: careerId,
        status: "error",
      });
    }
  }, [careerId, pathwayStatus, posthog]);

  const openResource = (
    url: string,
    stepId: string,
    resourceId: string,
    resourceType: string | null | undefined,
    costStatus: string | null | undefined,
  ) => {
    posthog.capture("learning_resource_opened", {
      career_id: careerId,
      step_id: stepId,
      resource_id: resourceId,
      resource_type: resourceType ?? null,
      cost_status: costStatus ?? null,
    });
    void Linking.openURL(url);
  };

  return (
    <ScreenContainer testID="pathway-screen">
      {pathwayStatus === "loading" || pathwayStatus === "idle" ? (
        <CatalogueSkeleton count={2} />
      ) : pathwayStatus === "error" ? (
        <ErrorState
          title={"We couldn't load the roadmap"}
          message="Something went wrong on our side or with your connection. Please try again."
          onRetry={() => void loadPathway(careerId)}
        />
      ) : !pathway ? (
        <EmptyState
          icon="map-outline"
          title="No roadmap yet"
          message={"We're still building this roadmap. Check back soon."}
        />
      ) : (
        <View>
          <Text style={styles.title}>{pathway.title}</Text>
          {pathway.description ? (
            <Text style={styles.subtitle}>{pathway.description}</Text>
          ) : null}

          {pathway.steps.map((step, index) => (
            <Card key={step.id} testID={`step-${step.id}`}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
              </View>
              {step.description ? <Text style={styles.body}>{step.description}</Text> : null}
              {step.learningObjective ? (
                <Text style={styles.objective}>🎯 {step.learningObjective}</Text>
              ) : null}

              {step.resources.map((resource) => (
                <View key={resource.id} style={styles.resource}>
                  <View style={styles.resourceHeader}>
                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <View style={styles.resourceBadges}>
                      {resource.type ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{resource.type}</Text>
                        </View>
                      ) : null}
                      {resource.costStatus ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{resource.costStatus}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  {resource.provider ? (
                    <Text style={styles.provider}>{resource.provider}</Text>
                  ) : null}
                  {resource.url ? (
                    <Text
                      style={styles.url}
                      accessibilityRole="link"
                      onPress={() =>
                        openResource(
                          resource.url as string,
                          step.id,
                          resource.id,
                          resource.type,
                          resource.costStatus,
                        )
                      }
                    >
                      {resource.url}
                    </Text>
                  ) : null}
                </View>
              ))}
            </Card>
          ))}
          <View style={styles.bottomPad} />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: colors.surface, fontWeight: "700", fontSize: 14 },
  stepTitle: { ...typography.sectionTitle, color: colors.text, flex: 1 },
  body: { ...typography.body, color: colors.text, marginBottom: spacing.sm },
  objective: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  resource: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  resourceHeader: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  resourceTitle: { ...typography.bodyMedium, color: colors.text, flex: 1 },
  resourceBadges: { flexDirection: "row", gap: spacing.xs },
  badge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { ...typography.caption, color: colors.primaryDark },
  provider: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  url: { ...typography.caption, color: colors.primaryDark, marginTop: spacing.xs },
  bottomPad: { height: spacing.xxl },
});
