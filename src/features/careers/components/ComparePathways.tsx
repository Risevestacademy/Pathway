import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@shared/components/EmptyState";
import { ErrorState } from "@shared/components/ErrorState";
import { PrimaryButton } from "@shared/components/PrimaryButton";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import type { Career, CareerDetail, OutlookEntry } from "../types";
import { careersRepository } from "../api/careersRepository";

interface Props {
  careers: Career[];
  onBack: () => void;
}

const CAREER_COLORS = ["#4F7DF3", "#22A35A"] as const;

export function ComparePathways({ careers, onBack }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compared, setCompared] = useState<CareerDetail[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const filteredCareers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? careers.filter((career) => career.title.toLowerCase().includes(normalizedQuery))
      : careers;
  }, [careers, query]);

  const toggleCareer = (careerId: string) => {
    setError(false);
    setSelectedIds((current) => {
      if (current.includes(careerId)) {
        return current.filter((id) => id !== careerId);
      }
      if (current.length === 2) return current;
      return [...current, careerId];
    });
  };

  const compareCareers = async () => {
    if (selectedIds.length !== 2 || isLoading) return;
    setIsLoading(true);
    setError(false);
    try {
      const details = await Promise.all(
        selectedIds.map((careerId) => careersRepository.getCareer(careerId)),
      );
      setCompared(details);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (compared) {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setCompared(null)}
          style={styles.backButton}
          testID="compare-back-button"
        >
          <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <View style={styles.compareHeader}>
          <CareerHeading career={compared[0]} color={CAREER_COLORS[0]} />
          <View style={styles.compareIcon}>
            <Ionicons name="git-compare-outline" size={18} color={colors.textSecondary} />
          </View>
          <CareerHeading career={compared[1]} color={CAREER_COLORS[1]} />
        </View>
        <CompareRow
          label="Overview"
          left={compared[0].roleSummary ?? compared[0].description}
          right={compared[1].roleSummary ?? compared[1].description}
        />
        <CompareRow
          label="Viability"
          left={getViability(compared[0].outlook)}
          right={getViability(compared[1].outlook)}
        />
        <CompareRow
          label="Skills"
          left={formatSkills(compared[0])}
          right={formatSkills(compared[1])}
        />
        <CompareRow
          label="Roadmap"
          left={compared[0].pathway ? `${compared[0].pathway.stepCount} steps` : "Not available"}
          right={compared[1].pathway ? `${compared[1].pathway.stepCount} steps` : "Not available"}
        />
        <View style={styles.resultActions}>
          <PrimaryButton
            title="Choose different careers"
            onPress={() => setCompared(null)}
            testID="change-careers-button"
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Compare Pathways</Text>
        <Text style={styles.subtitle}>You can only compare two at a time</Text>
        <View style={styles.searchBox}>
          <TextInput
            accessibilityLabel="Search for a pathway"
            placeholder="Search for a pathway"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
            testID="compare-search"
          />
          <Ionicons name="search-outline" size={18} color={colors.textTertiary} />
        </View>
        <Text style={styles.selectionCount}>{selectedIds.length} of 2 selected</Text>
        {careers.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No pathways to compare"
            message="Career pathways will appear here when the catalogue is available."
          />
        ) : filteredCareers.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="No pathways found"
            message="Try a different search."
          />
        ) : (
          <View>
            {filteredCareers.map((career, index) => {
              const isSelected = selectedIds.includes(career.id);
              const isLimitReached = selectedIds.length === 2 && !isSelected;
              return (
                <Pressable
                  key={career.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected, disabled: isLimitReached }}
                  accessibilityLabel={career.title}
                  disabled={isLimitReached}
                  onPress={() => toggleCareer(career.id)}
                  style={styles.careerRow}
                  testID={`compare-career-${career.id}`}
                >
                  <View
                    style={[
                      styles.careerIcon,
                      { backgroundColor: `${CAREER_COLORS[index % CAREER_COLORS.length]}22` },
                    ]}
                  >
                    <Ionicons
                      name="layers-outline"
                      size={18}
                      color={CAREER_COLORS[index % CAREER_COLORS.length]}
                    />
                  </View>
                  <Text style={styles.careerName}>{career.title}</Text>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={21}
                    color={isSelected ? colors.primary : colors.border}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
        {error ? (
          <ErrorState
            title={"We couldn't compare these pathways"}
            message="Please check your connection and try again."
            onRetry={() => void compareCareers()}
          />
        ) : null}
      </ScrollView>
      <View style={styles.compareButton}>
        <PrimaryButton
          title={isLoading ? "Loading comparison…" : "Compare"}
          onPress={() => void compareCareers()}
          disabled={selectedIds.length !== 2 || isLoading}
          loading={isLoading}
          testID="compare-button"
        />
      </View>
    </View>
  );
}

function CareerHeading({ career, color }: { career: CareerDetail; color: string }) {
  return (
    <View style={styles.careerHeading}>
      <View style={[styles.headingIcon, { backgroundColor: `${color}22` }]}>
        <Ionicons name="layers-outline" size={18} color={color} />
      </View>
      <Text style={styles.headingTitle} numberOfLines={2}>
        {career.title}
      </Text>
    </View>
  );
}

function CompareRow({
  label,
  left,
  right,
}: {
  label: string;
  left: string | null;
  right: string | null;
}) {
  return (
    <View style={styles.compareRow}>
      <View style={styles.rowValues}>
        <Text style={styles.rowValue}>{left || "Not available"}</Text>
        <Text style={styles.viabilityLabel}>{label}</Text>
        <Text style={[styles.rowValue, styles.rightValue]}>{right || "Not available"}</Text>
      </View>
    </View>
  );
}

function formatSkills(career: CareerDetail): string {
  return career.skills.length > 0
    ? career.skills.map((skill) => skill.name).join(" · ")
    : "Not available";
}

function getViability(outlook: OutlookEntry[]): string | null {
  const growth = outlook.find((entry) => entry.growthPercent !== null);
  if (growth?.growthPercent !== null && growth?.growthPercent !== undefined) {
    return `${growth.growthPercent >= 0 ? "+" : ""}${growth.growthPercent}% projected growth`;
  }
  const demand = outlook.find((entry) => entry.demandLevel)?.demandLevel;
  return demand ? `${demand} demand` : null;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    marginBottom: spacing.lg,
  },
  backLabel: { ...typography.caption, color: colors.textSecondary },
  title: { ...typography.sectionTitle, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
  searchBox: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { ...typography.caption, color: colors.text, flex: 1, paddingVertical: spacing.sm },
  selectionCount: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.xs },
  careerRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  careerIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  careerName: { ...typography.bodyMedium, color: colors.text, flex: 1 },
  compareButton: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  compareHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  careerHeading: { flex: 1, alignItems: "center", gap: spacing.sm },
  headingIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  headingTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  compareIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  compareRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
  },
  rowValues: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  rowValue: { ...typography.caption, color: colors.text, flex: 1 },
  rightValue: { textAlign: "right" },
  viabilityLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    width: 54,
    textAlign: "center",
  },
  resultActions: { marginTop: spacing.xl },
});
