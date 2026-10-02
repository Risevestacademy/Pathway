import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePostHog } from "posthog-react-native";
import { ScreenContainer } from "@shared/components/ScreenContainer";
import { Card } from "@shared/components/Card";
import { CatalogueSkeleton } from "@shared/components/CatalogueSkeleton";
import { ErrorState } from "@shared/components/ErrorState";
import { PrimaryButton } from "@shared/components/PrimaryButton";
import { colors, spacing, typography } from "@shared/design-system/tokens";
import type { RootStackParamList } from "@app/navigation/types";
import { useCareersStore } from "../store/careersStore";
import { PayOutlookCard } from "../components/PayOutlookCard";

type Props = NativeStackScreenProps<RootStackParamList, "CareerDetail">;

export function CareerDetailScreen({ navigation, route }: Props) {
  const posthog = usePostHog();
  const { careerId } = route.params;
  const { detail, detailStatus, loadCareer } = useCareersStore();

  useEffect(() => {
    void loadCareer(careerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerId]);

  useEffect(() => {
    if (detailStatus === "error") {
      posthog.logger.error("career detail request failed", {
        career_id: careerId,
        status: "error",
      });
    }
  }, [careerId, detailStatus, posthog]);

  const openRoadmap = () => {
    if (!detail) return;
    posthog.capture("career_roadmap_opened", { career_id: detail.id });
    navigation.navigate("Pathway", { careerId: detail.id, title: detail.title });
  };

  if (detailStatus === "loading" || detailStatus === "idle") {
    return (
      <ScreenContainer testID="career-detail-loading">
        <BackButton onPress={() => navigation.goBack()} />
        <CatalogueSkeleton count={2} />
      </ScreenContainer>
    );
  }

  if (detailStatus === "error" || !detail) {
    return (
      <ScreenContainer testID="career-detail-error">
        <BackButton onPress={() => navigation.goBack()} />
        <ErrorState
          title={"We couldn't load this career"}
          message="Something went wrong on our side or with your connection. Please try again."
          onRetry={() => void loadCareer(careerId)}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer testID="career-detail-screen">
      <BackButton onPress={() => navigation.goBack()} />

      <Text style={styles.title}>{detail.title}</Text>
      <Text style={styles.subtitle}>
        {detail.roleSummary ?? detail.description ?? ""}
      </Text>

      {detail.roleSummary ? (
        <View>
          <Text style={styles.sectionTitle}>What the role involves</Text>
          <Text style={styles.body}>{detail.description ?? detail.roleSummary}</Text>
        </View>
      ) : null}

      {detail.exampleActivities.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Example work activities</Text>
          {detail.exampleActivities.map((activity) => (
            <View key={activity} style={styles.activityRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.activityText}>{activity}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {detail.pathway ? (
        <View style={styles.section}>
          <Card testID="pathway-card">
            <View style={styles.pathwayIconWrap}>
              <Ionicons name="map-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.pathwayTitle}>
              Step-by-step roadmap to become a {detail.title}
            </Text>
            <Text style={styles.pathwayBody}>
              Recommended learning steps with curated resources. Go at your own pace.
            </Text>
            <PrimaryButton
              title="View roadmap"
              testID="view-roadmap-button"
              onPress={openRoadmap}
            />
          </Card>
        </View>
      ) : null}

      {detail.outlook.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pay and job outlook</Text>
          {detail.outlook.map((entry) => (
            <PayOutlookCard key={entry.id} entry={entry} />
          ))}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Back to careers" onPress={onPress} hitSlop={8}>
      <Text style={styles.back}>{"< All careers"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.lg },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  section: { marginTop: spacing.lg },
  sectionTitle: { ...typography.sectionTitle, color: colors.text, marginBottom: spacing.md },
  body: { ...typography.body, color: colors.text },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  activityText: { ...typography.body, color: colors.text, flex: 1 },
  pathwayIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  pathwayTitle: { ...typography.sectionTitle, color: colors.text, marginBottom: spacing.sm },
  pathwayBody: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
});
