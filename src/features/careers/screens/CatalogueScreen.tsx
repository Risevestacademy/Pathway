import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePostHog } from "posthog-react-native";
import { ScreenContainer } from "@shared/components/ScreenContainer";
import { CatalogueSkeleton } from "@shared/components/CatalogueSkeleton";
import { EmptyState } from "@shared/components/EmptyState";
import { ErrorState } from "@shared/components/ErrorState";
import { PrimaryButton } from "@shared/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import { CAREER_LEVEL_LABELS } from "@shared/types/domain";
import type { RootStackParamList } from "@app/navigation/types";
import { useOnboardingStore } from "@features/onboarding/store/onboardingStore";
import { useCareersStore } from "../store/careersStore";
import { LevelSwitcher } from "../components/LevelSwitcher";
import { FilterBanner } from "../components/FilterBanner";
import { CareerCard } from "../components/CareerCard";
import { ComparePathways } from "../components/ComparePathways";
import { useSavedCareers } from "../store/savedCareersStore";
import type { Career } from "../types";
import { useAuth } from "@features/auth/context/AuthContext";
import { DashboardTabBar } from "@features/dashboard/components/DashboardTabBar";
import { navigateToDashboardTab } from "@features/dashboard/navigation";
import type { DashboardTab } from "@features/dashboard/types";

type Props = NativeStackScreenProps<RootStackParamList, "Catalogue">;

export function CatalogueScreen({ navigation, route }: Props) {
  const posthog = usePostHog();
  const { logout, state: authState } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [exploreTab, setExploreTab] = useState<"Discover" | "Compare">("Discover");
  const store = useCareersStore();
  const userId = authState.status === "authenticated" ? authState.user.id : "anonymous";
  const savedCareers = useSavedCareers(userId);
  const { level, interests, skipped } = useOnboardingStore();

  // One-time initialisation from onboarding answers, then initial fetch.
  useEffect(() => {
    const showFiltered = route.params?.showFiltered === true;
    store.initializeCatalogue(level ?? "RECENT_GRAD", showFiltered && !skipped ? interests : []);
    void store.loadCareers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Level switching re-queries the catalogue.
  useEffect(() => {
    if (store.listStatus !== "idle") void store.loadCareers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.levelFilter]);

  useEffect(() => {
    if (store.listStatus === "error") {
      posthog.logger.error("career catalogue request failed", {
        career_level: store.levelFilter,
        filter_count: store.interestTags.length,
        status: "error",
      });
    }
  }, [posthog, store.interestTags.length, store.levelFilter, store.listStatus]);

  const clearFilters = () => {
    posthog.capture("career_filters_cleared", {
      filter_count: store.interestTags.length,
      career_level: store.levelFilter,
    });
    store.clearFilters();
    void useCareersStore.getState().loadCareers();
  };

  const changeLevelFilter = (selectedLevel: typeof store.levelFilter) => {
    posthog.capture("career_level_filter_changed", {
      previous_career_level: store.levelFilter,
      career_level: selectedLevel,
    });
    store.setLevelFilter(selectedLevel);
  };

  const openCareer = (careerId: string) => {
    posthog.capture("career_opened", {
      career_id: careerId,
      career_level: store.levelFilter,
      is_filtered: store.interestTags.length > 0,
    });
    navigation.navigate("CareerDetail", { careerId });
  };

  const toggleSavedCareer = (career: Career) => {
    void savedCareers.toggle(career).catch((error: unknown) => {
      Alert.alert(
        "Couldn't update saved careers",
        error instanceof Error ? error.message : "Please try again.",
      );
    });
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } catch {
      Alert.alert(
        "Sign-out incomplete",
        "We couldn't complete server sign-out or local credential cleanup. Please try again.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const fitLabel = CAREER_LEVEL_LABELS[store.levelFilter].toLowerCase();
  const selectTab = (tab: DashboardTab) => navigateToDashboardTab(navigation, tab);

  return (
    <ScreenContainer scroll={false} testID="catalogue-screen">
      <View style={styles.flex}>
        <View style={styles.screenHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isSigningOut, busy: isSigningOut }}
            disabled={isSigningOut}
            onPress={handleSignOut}
            style={styles.signOutButton}
          >
            {isSigningOut ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.signOutLabel}>Sign out</Text>
            )}
          </Pressable>
          <View style={styles.segmentedControl} accessibilityRole="tablist">
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: exploreTab === "Discover" }}
              onPress={() => setExploreTab("Discover")}
              style={[styles.segment, exploreTab === "Discover" && styles.selectedSegment]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  exploreTab === "Discover" && styles.selectedSegmentLabel,
                ]}
              >
                Discover
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: exploreTab === "Compare" }}
              onPress={() => setExploreTab("Compare")}
              style={[styles.segment, exploreTab === "Compare" && styles.selectedSegment]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  exploreTab === "Compare" && styles.selectedSegmentLabel,
                ]}
              >
                Compare
              </Text>
            </Pressable>
          </View>
        </View>
        {exploreTab === "Discover" ? (
          <FlatList
            style={styles.flex}
            data={store.careers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <View style={styles.discoverBanner}>
                  <Text style={styles.bannerTitle}>Discover Pathways</Text>
                  <Text style={styles.bannerText}>
                    See your existing skills and career gaps, based on what you share.
                  </Text>
                  <View style={styles.bannerStats}>
                    <View>
                      <Text style={styles.statLabel}>Pathways</Text>
                      <Text style={styles.statValue}>{store.careers.length}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View>
                      <Text style={styles.statLabel}>Career levels</Text>
                      <Text style={styles.statValue}>3</Text>
                    </View>
                  </View>
                  <View style={styles.bannerArt} pointerEvents="none">
                    <View style={[styles.cube, styles.cubeTop]} />
                    <View style={[styles.cube, styles.cubeBottom]} />
                  </View>
                </View>
                <Text style={styles.title}>Explore careers</Text>
                <Text style={styles.subtitle}>
                  Find a career path that fits your goals and interests.
                </Text>
                <LevelSwitcher selected={store.levelFilter} onSelect={changeLevelFilter} />
                <FilterBanner
                  tags={store.interestTags}
                  onEdit={() => navigation.navigate("AboutYou")}
                  onClear={clearFilters}
                />
                {store.listStatus === "success" ? (
                  <Text style={styles.count} testID="career-count">
                    {store.careers.length} {store.careers.length === 1 ? "career" : "careers"}
                  </Text>
                ) : null}
              </View>
            }
            renderItem={({ item }) => (
              <CareerCard
                career={item}
                fitLabel={fitLabel}
                onPress={() => openCareer(item.id)}
                isSaved={savedCareers.careers.some((career) => career.id === item.id)}
                onToggleSave={() => toggleSavedCareer(item)}
                saveDisabled={savedCareers.status !== "success" || savedCareers.isSaving}
              />
            )}
            ListEmptyComponent={
              store.listStatus === "loading" ? (
                <CatalogueSkeleton />
              ) : store.listStatus === "error" ? (
                <ErrorState
                  title={"We couldn't load careers"}
                  message="Something went wrong on our side or with your connection. Please try again."
                  onRetry={() => void store.loadCareers()}
                />
              ) : store.interestTags.length > 0 ? (
                <View testID="no-match-state">
                  <EmptyState
                    icon="search"
                    title="No careers match your filters"
                    message="Try removing some interests or skills, or clear filters to see the full catalogue."
                  />
                  <PrimaryButton
                    title="Clear filters"
                    testID="clear-filters-button"
                    onPress={clearFilters}
                  />
                </View>
              ) : (
                <EmptyState
                  testID="catalogue-empty"
                  icon="file-tray-outline"
                  title="No careers available yet"
                  message={"We're adding careers to the catalogue. Check back soon."}
                />
              )
            }
          />
        ) : store.listStatus === "loading" ? (
          <CatalogueSkeleton count={4} />
        ) : store.listStatus === "error" ? (
          <ErrorState
            title={"We couldn't load pathways"}
            message="Something went wrong on our side or with your connection. Please try again."
            onRetry={() => void store.loadCareers()}
          />
        ) : (
          <ComparePathways careers={store.careers} onBack={() => setExploreTab("Discover")} />
        )}
        <DashboardTabBar activeTab="Explore" onSelect={selectTab} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenHeader: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  listContent: { padding: spacing.xl, paddingBottom: 80 },
  segmentedControl: {
    flexDirection: "row",
    alignSelf: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  segment: {
    alignItems: "center",
    minHeight: 40,
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  selectedSegment: {
    backgroundColor: colors.primarySoft,
    borderColor: "#E9D5FF",
  },
  segmentLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  selectedSegmentLabel: { color: colors.primary },
  discoverBanner: {
    minHeight: 220,
    overflow: "hidden",
    position: "relative",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  bannerTitle: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  bannerText: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: "82%",
  },
  bannerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  statValue: { ...typography.sectionTitle, color: colors.text },
  statDivider: { width: StyleSheet.hairlineWidth, height: 48, backgroundColor: colors.border },
  bannerArt: {
    position: "absolute",
    right: -24,
    bottom: -34,
    width: 132,
    height: 132,
    transform: [{ rotate: "45deg" }],
  },
  cube: {
    position: "absolute",
    width: 76,
    height: 76,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: "#A78BFA",
  },
  cubeTop: { right: 0, top: 0 },
  cubeBottom: { left: 0, bottom: 0, backgroundColor: colors.primaryDark },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  count: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  signOutButton: {
    alignSelf: "flex-end",
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  signOutLabel: { ...typography.body, color: colors.primary, fontWeight: "600" },
});
