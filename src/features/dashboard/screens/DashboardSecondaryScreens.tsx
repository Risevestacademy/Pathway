import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@app/navigation/types";
import { Card } from "@shared/components/Card";
import { EmptyState } from "@shared/components/EmptyState";
import { ErrorState } from "@shared/components/ErrorState";
import { PrimaryButton } from "@shared/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import { useAuth } from "@features/auth/context/AuthContext";
import { DashboardScreenFrame } from "../components/DashboardScreenFrame";
import { navigateToDashboardTab } from "../navigation";
import { useSavedPathways } from "../hooks/useDashboardQueries";
import { activatePathway } from "../api/dashboardMutations";
import { ApiRequestError } from "@shared/api/client";
import { SkillCheckScreen } from "@features/careers/screens/SkillCheckScreen";
import { useSavedCareers } from "@features/careers/store/savedCareersStore";
import { CareerCard } from "@features/careers/components/CareerCard";
import type { Career } from "@features/careers/types";

type PathwayProps = NativeStackScreenProps<RootStackParamList, "PathwayTab">;
type OpportunitiesProps = NativeStackScreenProps<RootStackParamList, "Opportunities">;
type SavedProps = NativeStackScreenProps<RootStackParamList, "Saved">;

export function PathwayTabScreen({ navigation }: PathwayProps) {
  return <SkillCheckScreen navigation={navigation} />;
}

export function OpportunitiesTabScreen({ navigation }: OpportunitiesProps) {
  return (
    <DashboardScreenFrame
      activeTab="Opportunities"
      onSelectTab={(tab) => navigateToDashboardTab(navigation, tab)}
    >
      <View style={[styles.content, styles.centered]}>
        <EmptyState
          icon="briefcase-outline"
          title="Opportunities are coming soon"
          message="Explore career paths while we prepare opportunities for you."
        />
        <PrimaryButton
          title="Explore careers"
          onPress={() => navigation.navigate("Catalogue", { showFiltered: true })}
        />
      </View>
    </DashboardScreenFrame>
  );
}

export function SavedPathwaysScreen({ navigation }: SavedProps) {
  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : "anonymous";
  const query = useSavedPathways(userId);
  const savedCareers = useSavedCareers(userId);
  const [activatingCareerId, setActivatingCareerId] = React.useState<string | null>(null);
  const [activationError, setActivationError] = React.useState<string | null>(null);
  const savedCareerIds = new Set(savedCareers.careers.map((career) => career.id));
  const serverPathways = query.pathways.filter((pathway) => !savedCareerIds.has(pathway.career.id));
  const hasSavedCareers = savedCareers.careers.length > 0 || serverPathways.length > 0;
  const toggleSavedCareer = (career: Career) => {
    void savedCareers.toggle(career).catch((error: unknown) => {
      Alert.alert(
        "Couldn't update saved careers",
        error instanceof Error ? error.message : "Please try again.",
      );
    });
  };
  const setActive = async (careerId: string) => {
    setActivatingCareerId(careerId);
    setActivationError(null);
    try {
      await activatePathway(userId, careerId);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        setActivationError("This career does not have a pathway yet.");
      } else if (error instanceof ApiRequestError && error.status === 401) {
        setActivationError("Your session has expired. Please sign in again.");
      } else {
        setActivationError("We couldn't activate this pathway. Please try again.");
      }
    } finally {
      setActivatingCareerId(null);
    }
  };
  return (
    <DashboardScreenFrame
      activeTab="Saved"
      onSelectTab={(tab) => navigateToDashboardTab(navigation, tab)}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Saved Pathways</Text>
        <Text style={styles.body}>
          See your existing skills and career gaps, based on what you share.
        </Text>
        {(query.status === "loading" || savedCareers.status === "loading") && !hasSavedCareers ? (
          <View style={styles.status}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.body}>Loading saved careers…</Text>
          </View>
        ) : null}
        {query.status === "error" ? (
          <ErrorState
            title={"We couldn't load saved pathways"}
            message={query.errorMessage ?? "Please try again."}
            onRetry={() => void query.retry()}
          />
        ) : null}
        {savedCareers.status === "error" ? (
          <ErrorState
            title={"We couldn't load saved careers"}
            message={savedCareers.errorMessage ?? "Please try again."}
            onRetry={() => void savedCareers.load()}
          />
        ) : null}
        {savedCareers.status === "success" && query.status === "success" && !hasSavedCareers ? (
          <View>
            <EmptyState
              icon="heart-outline"
              title="No saved careers yet"
              message="Save a career to find it here."
            />
            <PrimaryButton
              title="Explore careers"
              onPress={() => navigation.navigate("Catalogue", { showFiltered: true })}
            />
          </View>
        ) : null}
        {hasSavedCareers ? (
          <View style={styles.savedList}>
            {savedCareers.careers.map((career) => (
              <CareerCard
                key={career.id}
                career={career}
                fitLabel="beginner"
                onPress={() => navigation.navigate("CareerDetail", { careerId: career.id })}
                isSaved
                onToggleSave={() => toggleSavedCareer(career)}
                saveDisabled={savedCareers.isSaving}
              />
            ))}
            {serverPathways.map((pathway) => (
              <Pressable
                key={pathway.career.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate("CareerDetail", { careerId: pathway.career.id })}
              >
                <Card>
                  <View style={styles.savedHeader}>
                    <Text style={styles.pathwayTitle}>{pathway.career.title}</Text>
                    {pathway.isActive ? <Text style={styles.activeBadge}>Active</Text> : null}
                  </View>
                  <Text style={styles.progressText}>
                    {pathway.progress.completed} of {pathway.progress.total} steps ·{" "}
                    {Math.round(Math.max(0, Math.min(100, pathway.progress.percentage)))}%
                  </Text>
                  {!pathway.isActive ? (
                    <PrimaryButton
                      title={
                        activatingCareerId === pathway.career.id
                          ? "Activating…"
                          : "Make active pathway"
                      }
                      disabled={activatingCareerId !== null}
                      onPress={() => void setActive(pathway.career.id)}
                    />
                  ) : null}
                </Card>
              </Pressable>
            ))}
          </View>
        ) : null}
        {activationError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {activationError}
          </Text>
        ) : null}
        {query.data && query.errorMessage ? (
          <Pressable accessibilityRole="button" onPress={() => void query.retry()}>
            <Text accessibilityRole="alert" style={styles.error}>
              Saved pathways may be out of date. Tap to retry.
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </DashboardScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  centered: { flex: 1, justifyContent: "center" },
  title: { ...typography.title, color: colors.text },
  pathwayTitle: { ...typography.sectionTitle, color: colors.text, marginBottom: spacing.sm },
  cardEyebrow: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  error: { ...typography.body, color: colors.danger },
  progressText: { ...typography.bodyMedium, color: colors.primaryDark, marginTop: spacing.md },
  status: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  stepTitle: { ...typography.body, color: colors.text, flex: 1 },
  savedList: { gap: spacing.md },
  savedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  activeBadge: {
    ...typography.caption,
    color: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
