import React, { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePostHog } from "posthog-react-native";
import { ScreenContainer } from "@shared/components/ScreenContainer";
import { Card } from "@shared/components/Card";
import { CatalogueSkeleton } from "@shared/components/CatalogueSkeleton";
import { ErrorState } from "@shared/components/ErrorState";
import { EmptyState } from "@shared/components/EmptyState";
import { PrimaryButton } from "@shared/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import type { RootStackParamList } from "@app/navigation/types";
import { useCareersStore } from "../store/careersStore";
import { useAuth } from "@features/auth/context/AuthContext";
import { useSavedCareers } from "../store/savedCareersStore";
import type { CareerDetail } from "../types";
import { PayOutlookCard } from "../components/PayOutlookCard";

type Props = NativeStackScreenProps<RootStackParamList, "CareerDetail">;
type DetailTab = "Overview" | "Career Projection" | "Requirements";

const DETAIL_TABS: DetailTab[] = ["Overview", "Career Projection", "Requirements"];

export function CareerDetailScreen({ navigation, route }: Props) {
  const posthog = usePostHog();
  const { careerId } = route.params;
  const { state: authState } = useAuth();
  const userId = authState.status === "authenticated" ? authState.user.id : "anonymous";
  const savedCareers = useSavedCareers(userId);
  const { detail, detailStatus, loadCareer } = useCareersStore();
  const [selectedTab, setSelectedTab] = useState<DetailTab>("Overview");

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

  const toggleSavedCareer = () => {
    if (!detail) return;
    void savedCareers
      .toggle({
        id: detail.id,
        slug: detail.slug,
        title: detail.title,
        shortDescription: detail.roleSummary ?? detail.description ?? "",
      })
      .catch((error: unknown) => {
        Alert.alert(
          "Couldn't update saved careers",
          error instanceof Error ? error.message : "Please try again.",
        );
      });
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.hero} testID="career-detail-hero">
          <View style={styles.heroContent}>
            <View style={styles.heroHeading}>
              <View style={styles.heroCopy}>
                <Text style={styles.title}>{detail.title}</Text>
                <Text style={styles.subtitle}>
                  {detail.roleSummary ?? detail.description ?? ""}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  savedCareers.careers.some((career) => career.id === detail.id)
                    ? `Unsave ${detail.title}`
                    : `Save ${detail.title}`
                }
                accessibilityState={{
                  selected: savedCareers.careers.some((career) => career.id === detail.id),
                  disabled: savedCareers.status !== "success" || savedCareers.isSaving,
                }}
                disabled={savedCareers.status !== "success" || savedCareers.isSaving}
                onPress={toggleSavedCareer}
                style={styles.bookmark}
                testID="career-detail-save-button"
              >
                <Ionicons
                  name={
                    savedCareers.careers.some((career) => career.id === detail.id)
                      ? "bookmark"
                      : "bookmark-outline"
                  }
                  size={20}
                  color={
                    savedCareers.careers.some((career) => career.id === detail.id)
                      ? colors.primary
                      : colors.textTertiary
                  }
                />
              </Pressable>
            </View>

            <View style={styles.heroArt} pointerEvents="none">
              <View style={styles.artLine} />
              <Ionicons name="analytics-outline" size={72} color="#D9468A" />
            </View>

            <View style={styles.heroStats}>
              <View>
                <Text style={styles.statLabel}>Roadmap steps</Text>
                <Text style={styles.statValue}>{detail.pathway?.stepCount ?? 0}</Text>
              </View>
              <View style={styles.statDivider} />
              <View>
                <Text style={styles.statLabel}>Skills</Text>
                <Text style={styles.statValue}>{detail.skills.length}</Text>
              </View>
            </View>
            {detail.pathway ? (
              <PrimaryButton
                title="Begin roadmap  →"
                testID="begin-roadmap-button"
                onPress={openRoadmap}
              />
            ) : null}
          </View>
        </Card>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          accessibilityRole="tablist"
        >
          {DETAIL_TABS.map((tab) => {
            const selected = selectedTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => setSelectedTab(tab)}
                style={[styles.tab, selected && styles.selectedTab]}
              >
                <Text style={[styles.tabLabel, selected && styles.selectedTabLabel]}>{tab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {selectedTab === "Overview" ? (
          <Overview detail={detail} />
        ) : selectedTab === "Career Projection" ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Pay & job outlook</Text>
            {detail.outlook.length > 0 ? (
              detail.outlook.map((entry) => <PayOutlookCard key={entry.id} entry={entry} />)
            ) : (
              <EmptyState
                icon="stats-chart-outline"
                title="Outlook information unavailable"
                message="There isn't pay or job outlook information for this career yet."
              />
            )}
          </View>
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Skills you’ll need</Text>
            {detail.skills.length > 0 ? (
              <View style={styles.skills}>
                {detail.skills.map((skill) => (
                  <View key={skill.id} style={styles.skillChip}>
                    <Text style={styles.skillLabel}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="construct-outline"
                title="Skills information unavailable"
                message="Skills for this career haven't been added yet."
              />
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function Overview({ detail }: { detail: CareerDetail }) {
  return (
    <View style={styles.sectionCard}>
      {detail.roleSummary || detail.description ? (
        <View style={styles.roleCard}>
          <Text style={styles.sectionTitle}>What the role involves</Text>
          <Text style={styles.body}>{detail.description ?? detail.roleSummary}</Text>
        </View>
      ) : null}
      {detail.exampleActivities.length > 0 ? (
        <View style={styles.activities}>
          <Text style={styles.sectionTitle}>Example work activities</Text>
          {detail.exampleActivities.map((activity, index) => (
            <View key={`${index}-${activity}`} style={styles.activity}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.body}>{activity}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {!detail.roleSummary && !detail.description && detail.exampleActivities.length === 0 ? (
        <EmptyState
          icon="information-circle-outline"
          title="Career overview unavailable"
          message="Overview information for this career hasn't been added yet."
        />
      ) : null}
    </View>
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
      <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl },
  backButton: { marginBottom: spacing.md, alignSelf: "flex-start" },
  hero: {
    overflow: "hidden",
    padding: spacing.xl,
    backgroundColor: "#FFF9FC",
  },
  heroContent: { position: "relative" },
  heroHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  heroCopy: { flex: 1 },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  bookmark: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroArt: {
    position: "absolute",
    right: -spacing.xl,
    bottom: 30,
    width: 100,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.75,
  },
  artLine: {
    position: "absolute",
    width: 130,
    height: 50,
    borderTopWidth: 5,
    borderColor: "#EC4899",
    transform: [{ rotate: "-28deg" }],
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  statValue: { ...typography.sectionTitle, color: colors.text },
  statDivider: { width: StyleSheet.hairlineWidth, height: 40, backgroundColor: colors.border },
  tabs: { gap: spacing.sm, paddingBottom: spacing.md },
  tab: {
    minHeight: 40,
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  selectedTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: { ...typography.caption, color: colors.textSecondary },
  selectedTabLabel: { color: colors.surface },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  roleCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: { ...typography.body, color: colors.textSecondary, flex: 1 },
  activities: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  activity: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skillChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skillLabel: { ...typography.bodyMedium, color: colors.textSecondary },
});
