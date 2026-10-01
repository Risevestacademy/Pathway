import React, { useEffect } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePostHog } from "posthog-react-native";
import { ScreenContainer } from "@shared/components/ScreenContainer";
import { CatalogueSkeleton } from "@shared/components/CatalogueSkeleton";
import { EmptyState } from "@shared/components/EmptyState";
import { ErrorState } from "@shared/components/ErrorState";
import { PrimaryButton } from "@shared/components/PrimaryButton";
import { colors, spacing, typography } from "@shared/design-system/tokens";
import { CAREER_LEVEL_LABELS } from "@shared/types/domain";
import type { RootStackParamList } from "@app/navigation/types";
import { useOnboardingStore } from "@features/onboarding/store/onboardingStore";
import { useCareersStore } from "../store/careersStore";
import { LevelSwitcher } from "../components/LevelSwitcher";
import { FilterBanner } from "../components/FilterBanner";
import { CareerCard } from "../components/CareerCard";

type Props = NativeStackScreenProps<RootStackParamList, "Catalogue">;

export function CatalogueScreen({ navigation, route }: Props) {
  const posthog = usePostHog();
  const store = useCareersStore();
  const { level, interests, skipped } = useOnboardingStore();

  // One-time initialisation from onboarding answers, then initial fetch.
  useEffect(() => {
    const showFiltered = route.params?.showFiltered === true;
    store.initializeCatalogue(
      level ?? "RECENT_GRAD",
      showFiltered && !skipped ? interests : [],
    );
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

  const fitLabel = CAREER_LEVEL_LABELS[store.levelFilter].toLowerCase();

  return (
    <ScreenContainer scroll={false} testID="catalogue-screen">
      <FlatList
        data={store.careers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Explore careers</Text>
            <Text style={styles.subtitle}>
              Open any career to see what the work involves, pay, outlook and a roadmap.
            </Text>
            <LevelSwitcher
              selected={store.levelFilter}
              onSelect={changeLevelFilter}
            />
            <FilterBanner
              tags={store.interestTags}
              onEdit={() => navigation.goBack()}
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
            // Filtered to zero: offer a way back to the full catalogue.
            <View testID="no-match-state">
              <EmptyState
                icon="search"
                title="No careers match your filters"
                message="Try removing some interests or skills, or clear filters to see the full catalogue."
              />
              <PrimaryButton title="Clear filters" testID="clear-filters-button" onPress={clearFilters} />
            </View>
          ) : (
            // Catalogue genuinely empty: no "clear filters" action per design.
            <EmptyState
              testID="catalogue-empty"
              icon="file-tray-outline"
              title="No careers available yet"
              message={"We're adding careers to the catalogue. Check back soon."}
            />
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  count: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
});
