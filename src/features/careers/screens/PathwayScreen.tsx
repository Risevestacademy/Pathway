import React, { useEffect } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SvgXml } from "react-native-svg";
import { usePostHog } from "posthog-react-native";
import { ScreenContainer } from "@shared/components/ScreenContainer";
import { Card } from "@shared/components/Card";
import { CatalogueSkeleton } from "@shared/components/CatalogueSkeleton";
import { EmptyState } from "@shared/components/EmptyState";
import { ErrorState } from "@shared/components/ErrorState";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import type { RootStackParamList } from "@app/navigation/types";
import { useCareersStore } from "../store/careersStore";

const arrowLeftIconXml = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.70711 16.7071C9.31658 17.0976 8.68342 17.0976 8.29289 16.7071L2.29289 10.7071C1.90237 10.3166 1.90237 9.68342 2.29289 9.29289L8.29289 3.29289C8.68342 2.90237 9.31658 2.90237 9.70711 3.29289C10.0976 3.68342 10.0976 4.31658 9.70711 4.70711L5.41421 9H17C17.5523 9 18 9.44772 18 10C18 10.5523 17.5523 11 17 11L5.41421 11L9.70711 15.2929C10.0976 15.6834 10.0976 16.3166 9.70711 16.7071Z" fill="currentColor"/></svg>`;

const getBadgeTone = (label: string | null | undefined) => {
  const value = (label ?? "").toLowerCase();

  if (value.includes("certification")) return "red";
  if (value.includes("book")) return "brown";
  if (value.includes("paid")) return "yellow";
  if (value.includes("free")) return "green";
  if (value.includes("course")) return "blue";
  return "purple";
};

type Props = NativeStackScreenProps<RootStackParamList, "Pathway">;

/** Simple pathway screen built from the API schema (no final design yet). */
export function PathwayScreen({ navigation, route }: Props) {
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
      <BackButton onPress={() => navigation.goBack()} />

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

              {step.resources.map((resource) => {
                const typeTone = getBadgeTone(resource.type);
                const costTone = getBadgeTone(resource.costStatus);

                return (
                  <View key={resource.id} style={styles.resource}>
                    <View style={styles.resourceHeader}>
                      <Text style={styles.resourceTitle}>{resource.title}</Text>
                      <View style={styles.resourceBadges}>
                        {resource.type ? (
                          <View style={[styles.badge, styles[`${typeTone}Badge`]]}>
                            <Text style={[styles.badgeText, styles[`${typeTone}BadgeText`]]}>
                              {resource.type}
                            </Text>
                          </View>
                        ) : null}
                        {resource.costStatus ? (
                          <View style={[styles.badge, styles[`${costTone}Badge`]]}>
                            <Text style={[styles.badgeText, styles[`${costTone}BadgeText`]]}>
                              {resource.costStatus}
                            </Text>
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
                );
              })}
            </Card>
          ))}
          <View style={styles.bottomPad} />
        </View>
      )}
    </ScreenContainer>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to careers"
      onPress={onPress}
      hitSlop={8}
      style={styles.backButton}
    >
      <SvgXml xml={arrowLeftIconXml} width={20} height={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: { marginBottom: spacing.md, alignSelf: "flex-start" },
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
  resourceBadges: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap", justifyContent: "flex-end" },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  purpleBadge: { backgroundColor: colors.primarySoft },
  greenBadge: { backgroundColor: "#DCFCE7" },
  blueBadge: { backgroundColor: "#DBEAFE" },
  yellowBadge: { backgroundColor: "#FEF3C7" },
  brownBadge: { backgroundColor: "#F5E6D3" },
  redBadge: { backgroundColor: "#FEE2E2" },
  badgeText: { ...typography.caption, lineHeight: 16 },
  purpleBadgeText: { color: colors.primaryDark },
  greenBadgeText: { color: "#166534" },
  blueBadgeText: { color: "#1D4ED8" },
  yellowBadgeText: { color: "#92400E" },
  brownBadgeText: { color: "#78350F" },
  redBadgeText: { color: "#991B1B" },
  provider: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  url: { ...typography.caption, color: colors.primaryDark, marginTop: spacing.xs },
  bottomPad: { height: spacing.xxl },
});
