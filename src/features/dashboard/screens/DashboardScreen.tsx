import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { SvgProps } from "react-native-svg";
import DashboardArtwork from "@app/assets/icons/dashboard.svg";
import FolderIcon from "@app/assets/icons/folder.svg";
import InactiveTrophy from "@app/assets/icons/inactive.svg";
import LanesArtwork from "@app/assets/icons/lanes.svg";
import PathwaysArtwork from "@app/assets/icons/pathways.svg";
import Avatar from "@app/assets/icons/cutie.svg";
import FlameIcon from "@app/assets/icons/flame.svg";
import XpIcon from "@app/assets/icons/xpicon.svg";
import type { RootStackParamList } from "@app/navigation/types";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import { useAuth } from "@features/auth/context/AuthContext";
import { getDashboardDevelopmentFixture } from "../data/dashboardFixtures";
import { useActivePathway, useSavedPathways } from "../hooks/useDashboardQueries";
import { useSavedCareers } from "@features/careers/store/savedCareersStore";
import type { DashboardSnapshot, DashboardTab } from "../types";
import { DashboardScreenFrame } from "../components/DashboardScreenFrame";
import { navigateToDashboardTab } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const ACTIVITY_WEEKS = 20;
const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function DashboardScreen({ navigation }: Props) {
  const { state: authState } = useAuth();
  const userId = authState.status === "authenticated" ? authState.user.id : "anonymous";
  const activeQuery = useActivePathway(userId);
  const savedQuery = useSavedPathways(userId);
  const savedCareers = useSavedCareers(userId);
  const savedPathwayCount =
    savedQuery.status === "success" && savedCareers.status === "success"
      ? new Set([
          ...savedQuery.pathways.map((pathway) => pathway.career.id),
          ...savedCareers.careers.map((career) => career.id),
        ]).size
      : null;
  const active = activeQuery.activePathway;
  const fixture = activeQuery.status === "success" ? getDashboardDevelopmentFixture() : null;
  const firstName =
    authState.status === "authenticated"
      ? authState.user.fullName.trim().split(/\s+/)[0] || "there"
      : "there";
  const greeting = getGreeting(new Date());
  const nextStepId = active?.progress?.nextStepId;
  const nextStep = nextStepId ? active?.steps.find((step) => step.id === nextStepId) : undefined;
  const heroState = active
    ? active.career && active.pathway
      ? "active"
      : "empty"
    : activeQuery.status === "error"
      ? "error"
      : "loading";
  const currentProgress = active?.progress?.percentage;

  const selectTab = (tab: DashboardTab) => navigateToDashboardTab(navigation, tab);

  const retryDashboard = () => {
    void activeQuery.retry();
    void savedQuery.retry();
  };

  return (
    <DashboardScreenFrame activeTab="Home" onSelectTab={selectTab}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.metrics}>
            <View style={styles.metricsPill}>
              <View style={styles.metric}>
                <XpIcon width={20} height={20} />
                <Text style={styles.metricText}>{fixture ? `${fixture.xp} XP` : "—"}</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.metric}>
                <FlameIcon width={20} height={20} />
                <Text style={styles.metricText}>{fixture ? fixture.streak : "—"}</Text>
              </View>
            </View>
            <Avatar width={42} height={42} />
          </View>
          <Text style={styles.greeting}>
            {greeting}, {firstName}
          </Text>
        </View>

        <MainPathwayCard
          state={heroState}
          activeError={activeQuery.errorMessage}
          careerTitle={active?.career?.title}
          progress={currentProgress}
          nextStepTitle={nextStep?.title}
          isRefetching={activeQuery.isFetching}
          onRetry={retryDashboard}
          onExplore={() => selectTab("Explore")}
          onContinue={() => {
            if (nextStep && nextStepId) {
              navigation.navigate("LearningStep", { stepId: nextStepId });
            } else if (active?.career) {
              navigation.navigate("Pathway", {
                careerId: active.career.id,
                title: active.career.title,
              });
            }
          }}
        />

        <View style={styles.statRow}>
          <StatCard
            title="Pathways"
            value={
              savedPathwayCount === null
                ? savedQuery.status === "loading" || savedCareers.status === "loading"
                  ? "…"
                  : "—"
                : String(savedPathwayCount)
            }
            Illustration={PathwaysArtwork}
            testID="pathways-stat"
          />
          <StatCard
            title="Lanes Completed"
            value={fixture ? String(fixture.lanesCompleted) : "—"}
            subtitle={fixture ? "Dev placeholder" : undefined}
            Illustration={LanesArtwork}
            testID="lanes-stat"
          />
        </View>
        {active && activeQuery.errorMessage ? (
          <Pressable accessibilityRole="button" onPress={() => void activeQuery.retry()}>
            <Text accessibilityRole="alert" style={styles.dataNotice}>
              Your pathway may be out of date. Tap to retry.
            </Text>
          </Pressable>
        ) : null}
        {savedQuery.errorMessage ? (
          <Pressable accessibilityRole="button" onPress={() => void savedQuery.retry()}>
            <Text accessibilityRole="alert" style={styles.dataNotice}>
              {savedQuery.data
                ? "Pathway totals may be out of date. Tap to retry."
                : "Pathway totals couldn't be loaded. Tap to retry."}
            </Text>
          </Pressable>
        ) : null}
        {savedCareers.status === "error" ? (
          <Pressable accessibilityRole="button" onPress={() => void savedCareers.load()}>
            <Text accessibilityRole="alert" style={styles.dataNotice}>
              Saved careers couldn't be loaded from this device. Tap to retry.
            </Text>
          </Pressable>
        ) : null}

        <GoalsSection snapshot={fixture} />
        <ProjectsSection
          snapshot={fixture}
          onBuildPathway={() => selectTab("Explore")}
          onContinue={() => selectTab("Pathway")}
        />
        <ActivitySection snapshot={fixture} />
        <TrophiesSection snapshot={fixture} />
      </ScrollView>
    </DashboardScreenFrame>
  );
}

function MainPathwayCard({
  state,
  activeError,
  careerTitle,
  progress,
  nextStepTitle,
  isRefetching,
  onRetry,
  onExplore,
  onContinue,
}: {
  state: "loading" | "empty" | "active" | "error";
  activeError: string | null;
  careerTitle?: string;
  progress?: number;
  nextStepTitle?: string;
  isRefetching: boolean;
  onRetry: () => void;
  onExplore: () => void;
  onContinue: () => void;
}) {
  const activeState = state === "active" && careerTitle;
  const [artworkSize, setArtworkSize] = useState({ width: 0, height: 0 });

  return (
    <View
      style={styles.mainCard}
      testID="dashboard-hero-card"
      accessibilityLabel="Dashboard pathway card"
      accessibilityValue={{ text: state }}
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;
        setArtworkSize((current) =>
          current.width === width && current.height === height ? current : { width, height },
        );
      }}
    >
      {artworkSize.width > 0 && artworkSize.height > 0 ? (
        <DashboardArtwork
          width={artworkSize.width}
          height={artworkSize.height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : null}
      {state === "loading" ? (
        <View style={styles.mainCardStatus}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.statusText}>Loading your pathway…</Text>
        </View>
      ) : state === "error" ? (
        <View style={styles.mainCardStatus}>
          <Text style={styles.mainError}>{activeError ?? "We couldn't load your pathway."}</Text>
          <Pressable accessibilityRole="button" onPress={onRetry}>
            <Text style={styles.link}>Try again</Text>
          </Pressable>
        </View>
      ) : activeState ? (
        <>
          {isRefetching ? (
            <ActivityIndicator
              accessibilityLabel="Refreshing pathway"
              color={colors.primary}
              size="small"
              style={styles.refreshIndicator}
            />
          ) : null}
          <Text style={styles.progressLabel}>Current progress</Text>
          <Text style={styles.progressValue}>
            {typeof progress === "number" && Number.isFinite(progress)
              ? `${Math.round(Math.max(0, Math.min(100, progress)))}%`
              : "—"}
          </Text>
          {typeof progress !== "number" || !Number.isFinite(progress) ? (
            <Text style={styles.progressUnavailable}>Progress data unavailable</Text>
          ) : (
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progress))}%` }]}
              />
            </View>
          )}
          <Pressable accessibilityRole="button" onPress={onContinue} style={styles.resumeLink}>
            <Text numberOfLines={1} style={styles.resumeText}>
              {nextStepTitle ? `Continue ${nextStepTitle}` : "View your pathway"}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.primary} />
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.newUserHeading}>Your pathway{"\n"}starts here!</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={onExplore}
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueLabel}>Continue →</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  Illustration,
  testID,
}: {
  title: string;
  value: string;
  subtitle?: string;
  Illustration: React.ComponentType<SvgProps>;
  testID: string;
}) {
  return (
    <View style={styles.statCard} testID={testID}>
      <Illustration width="100%" height="100%" style={StyleSheet.absoluteFill} />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, subtitle && styles.statValueWithSubtitle]}>{value}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function GoalsSection({ snapshot }: { snapshot: DashboardSnapshot | null }) {
  const completedDays = useMemo(() => new Set(snapshot?.completedWeekdays ?? []), [snapshot]);
  const week = useMemo(() => getCurrentWeek(new Date()), []);

  return (
    <SectionCard title="Today's Goals" testID="goals-section">
      <View style={styles.goalsInner}>
        <View style={styles.weekRow}>
          {week.map((date, index) => {
            const complete = completedDays.has(index);
            const today = isSameDay(date, new Date());
            return (
              <View key={WEEKDAYS[index]} style={styles.weekDay}>
                <View style={[styles.dayCircle, complete && styles.dayCircleComplete]}>
                  {complete ? <Ionicons name="checkmark" size={17} color="#FFFFFF" /> : null}
                </View>
                <Text style={[styles.weekdayLabel, today && styles.currentWeekdayLabel]}>
                  {WEEKDAYS[index]}
                </Text>
              </View>
            );
          })}
        </View>
        {snapshot ? (
          <View style={styles.goalList}>
            {snapshot.goals.map((goal) => (
              <View key={goal.id} style={styles.goalRow} testID={`goal-${goal.id}`}>
                <View style={[styles.goalIndicator, goal.completed && styles.goalComplete]}>
                  {goal.completed ? (
                    <Ionicons name="checkmark" size={14} color={colors.primary} />
                  ) : null}
                </View>
                <Text
                  numberOfLines={1}
                  style={[styles.goalTitle, goal.completed && styles.goalTitleComplete]}
                >
                  {goal.title}
                </Text>
                <Text style={styles.xpBadge}>+{goal.xp} XP</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.unavailableText}>Goals will appear when goal data is available.</Text>
        )}
      </View>
    </SectionCard>
  );
}

function ProjectsSection({
  snapshot,
  onBuildPathway,
  onContinue,
}: {
  snapshot: DashboardSnapshot | null;
  onBuildPathway: () => void;
  onContinue: () => void;
}) {
  return (
    <SectionCard title="Current Projects" testID="projects-section">
      {snapshot === null ? (
        <View style={styles.projectEmpty}>
          <Text style={styles.unavailableText}>Project data is not available yet.</Text>
        </View>
      ) : snapshot.projects.length === 0 ? (
        <View style={styles.projectEmpty} testID="projects-empty-state">
          <FolderIcon width={42} height={42} />
          <Text style={styles.projectEmptyTitle}>No projects yet</Text>
          <Text style={styles.projectDescription}>
            Your current projects, progress, and feedback will show up here.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Build my Pathway"
            onPress={onBuildPathway}
            style={styles.buildLink}
          >
            <Text style={styles.buildLinkText}>Build my Pathway</Text>
            <Ionicons name="arrow-forward" size={19} color={colors.primary} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.projectList}>
          {snapshot.projects.map((project) => (
            <View key={project.id} style={styles.projectCard}>
              <Text style={styles.projectTitle}>{project.title}</Text>
              <Text style={styles.projectDescription}>{project.description}</Text>
              <Text style={styles.projectSkills}>{project.skills.join("  ·  ")}</Text>
              <View style={styles.projectProgressTrack}>
                <View style={[styles.projectProgressFill, { width: `${project.progress}%` }]} />
              </View>
              <View style={styles.projectMeta}>
                <Text style={styles.projectPathway}>{project.pathwayTitle}</Text>
                <Text style={styles.projectPercent}>{project.progress}%</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={onContinue}
                style={styles.projectContinue}
              >
                <Text style={styles.projectContinueText}>Continue</Text>
                <Ionicons name="arrow-forward" size={19} color={colors.surface} />
              </Pressable>
            </View>
          ))}
          {snapshot.projects.length > 1 ? (
            <Text style={styles.moreProjects}>+{snapshot.projects.length - 1} more</Text>
          ) : null}
        </View>
      )}
    </SectionCard>
  );
}

function ActivitySection({ snapshot }: { snapshot: DashboardSnapshot | null }) {
  const weeks = useMemo(() => getActivityWeeks(new Date()), []);
  const activityByDaysAgo = useMemo(
    () => new Map((snapshot?.activity ?? []).map(({ daysAgo, intensity }) => [daysAgo, intensity])),
    [snapshot],
  );
  const monthGroups = useMemo(() => groupMonths(weeks), [weeks]);

  return (
    <SectionCard title="Activity" testID="activity-section">
      <View style={styles.activityGrid}>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.activityColumn}>
            {week.map((date, dayIndex) => {
              const daysAgo = differenceInDays(new Date(), date);
              const intensity = daysAgo >= 0 ? activityByDaysAgo.get(daysAgo) : undefined;
              const activityStyle =
                intensity === 1
                  ? styles.activity1
                  : intensity === 2
                    ? styles.activity2
                    : intensity === 3
                      ? styles.activity3
                      : styles.activityEmpty;
              return <View key={dayIndex} style={[styles.activityCell, activityStyle]} />;
            })}
          </View>
        ))}
      </View>
      <View style={styles.monthLabels}>
        {monthGroups.map((month) => (
          <Text key={month.label} style={[styles.monthLabel, { flex: month.span }]}>
            {month.label}
          </Text>
        ))}
      </View>
      {snapshot === null ? (
        <Text style={styles.activityUnavailable}>Activity history is not available yet.</Text>
      ) : null}
    </SectionCard>
  );
}

function TrophiesSection({ snapshot }: { snapshot: DashboardSnapshot | null }) {
  const trophies = snapshot?.achievements ?? [];
  const trophyCount = snapshot?.trophyCount;
  return (
    <SectionCard title="Trophies" testID="trophies-section">
      <View style={styles.trophyCount}>
        <Ionicons name="trophy" size={24} color="#F6B800" />
        <Text style={styles.trophyNumber}>{trophyCount === undefined ? "—" : trophyCount}</Text>
      </View>
      <View style={styles.trophyRow}>
        {Array.from({ length: 5 }, (_, index) => {
          const earned = trophies[index];
          return earned ? (
            <View
              key={earned.id}
              accessibilityLabel={`${earned.title} trophy`}
              style={[styles.earnedTrophy, { backgroundColor: `${earned.color}22` }]}
            >
              <Ionicons name="trophy" size={31} color={earned.color} />
            </View>
          ) : (
            <InactiveTrophy
              key={`inactive-${index}`}
              width={58}
              height={58}
              accessibilityLabel="Locked trophy"
            />
          );
        })}
      </View>
      {snapshot === null ? (
        <Text style={styles.activityUnavailable}>Achievement data is not available yet.</Text>
      ) : null}
    </SectionCard>
  );
}

function SectionCard({
  title,
  children,
  testID,
}: {
  title: string;
  children: React.ReactNode;
  testID: string;
}) {
  return (
    <View style={styles.sectionCard} testID={testID}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function getGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getCurrentWeek(today: Date): Date[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return WEEKDAYS.map((_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function getActivityWeeks(today: Date): Date[][] {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setDate(monday.getDate() - (ACTIVITY_WEEKS - 1) * 7);
  return Array.from({ length: ACTIVITY_WEEKS }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + weekIndex * 7 + dayIndex);
      return date;
    }),
  );
}

function groupMonths(weeks: Date[][]): { label: string; span: number }[] {
  const groups: { label: string; span: number }[] = [];
  for (const week of weeks) {
    const label = week[0].toLocaleDateString(undefined, { month: "short" });
    const last = groups[groups.length - 1];
    if (last?.label === label) last.span += 1;
    else groups.push({ label, span: 1 });
  }
  return groups;
}

function differenceInDays(today: Date, date: Date): number {
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((todayMidnight.getTime() - dateMidnight.getTime()) / 86_400_000);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: { gap: spacing.lg, marginBottom: spacing.xs },
  metrics: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.md,
  },
  metricsPill: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#ECECEC",
    flexDirection: "row",
    alignItems: "center",
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  metricText: { ...typography.body, color: colors.textSecondary, fontSize: 14 },
  separator: { width: 1, height: 24, backgroundColor: "#E8E8E8", marginHorizontal: spacing.xs },
  greeting: { ...typography.title, fontSize: 24, lineHeight: 31, color: "#161616" },
  mainCard: {
    width: "100%",
    aspectRatio: 361 / 172,
    minHeight: 172,
    flexShrink: 0,
    position: "relative",
    backgroundColor: "#F6F0FF",
    overflow: "hidden",
    borderRadius: 12,
    justifyContent: "center",
  },
  mainCardStatus: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  refreshIndicator: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  statusText: { ...typography.body, color: colors.textSecondary },
  mainError: { ...typography.body, color: colors.text, textAlign: "center" },
  newUserHeading: {
    position: "absolute",
    left: spacing.lg,
    top: spacing.lg,
    maxWidth: "55%",
    ...typography.sectionTitle,
    color: "#171717",
    fontSize: 20,
    lineHeight: 25,
  },
  continueButton: {
    position: "absolute",
    left: spacing.lg,
    bottom: spacing.lg,
    minWidth: 120,
    height: 38,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderBottomWidth: 3,
    borderBottomColor: "#7640D4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  continueButtonPressed: { backgroundColor: "#7C4CE0" },
  continueLabel: { ...typography.bodyMedium, color: colors.surface, fontSize: 15 },
  progressLabel: {
    position: "absolute",
    left: spacing.lg,
    top: spacing.lg,
    color: colors.textSecondary,
    fontSize: 15,
  },
  progressValue: {
    position: "absolute",
    left: spacing.lg,
    top: 44,
    ...typography.title,
    fontSize: 24,
    color: colors.text,
  },
  progressTrack: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.xl,
    bottom: 42,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: radius.pill, backgroundColor: colors.primary },
  progressUnavailable: {
    position: "absolute",
    left: spacing.lg,
    bottom: 44,
    ...typography.caption,
    color: colors.textSecondary,
  },
  resumeLink: {
    position: "absolute",
    left: spacing.lg,
    bottom: spacing.md,
    maxWidth: "75%",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  resumeText: { ...typography.bodyMedium, color: colors.primary, flexShrink: 1 },
  link: { ...typography.bodyMedium, color: colors.primary, textDecorationLine: "underline" },
  statRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    aspectRatio: 177 / 120,
    minHeight: 100,
    overflow: "hidden",
  },
  statTitle: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontSize: 14,
  },
  statValue: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    ...typography.title,
    fontSize: 24,
    lineHeight: 30,
    color: "#171717",
  },
  statValueWithSubtitle: { bottom: spacing.lg + spacing.xs },
  statSubtitle: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.xs,
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
  dataNotice: { ...typography.caption, color: colors.textSecondary, marginTop: -spacing.sm },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 16,
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.bodyMedium,
    color: "#777777",
    fontSize: 15,
    marginBottom: spacing.md,
  },
  goalsInner: {
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg },
  weekDay: { alignItems: "center", gap: spacing.xs, flex: 1 },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleComplete: { backgroundColor: colors.primary },
  weekdayLabel: { ...typography.caption, color: "#A0A0A0", fontSize: 11 },
  currentWeekdayLabel: { color: colors.primaryDark, fontWeight: "600" },
  goalList: { gap: spacing.xs },
  goalRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 11,
    backgroundColor: colors.surface,
  },
  goalIndicator: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: "#E4E4E4",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  goalComplete: { borderColor: colors.primary, backgroundColor: "#F2E9FF", borderStyle: "solid" },
  goalTitle: { ...typography.bodyMedium, color: "#111111", flex: 1, fontSize: 14 },
  goalTitleComplete: { textDecorationLine: "line-through", color: colors.textSecondary },
  xpBadge: {
    ...typography.bodyMedium,
    color: colors.primary,
    backgroundColor: "#F4ECFF",
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    fontSize: 13,
  },
  unavailableText: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  projectEmpty: {
    minHeight: 195,
    padding: spacing.lg,
    borderRadius: 11,
    backgroundColor: "#F8F8F8",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  projectEmptyTitle: { ...typography.sectionTitle, color: "#666666" },
  projectDescription: {
    ...typography.body,
    color: "#777777",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  buildLink: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  buildLinkText: { ...typography.bodyMedium, color: colors.primary, fontSize: 15 },
  projectList: { gap: spacing.sm },
  projectCard: {
    padding: spacing.md,
    borderRadius: 11,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  projectTitle: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  projectSkills: { ...typography.caption, color: "#A0A0A0", marginTop: spacing.sm },
  projectProgressTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: "#EEEEEE",
    marginTop: spacing.md,
    overflow: "hidden",
  },
  projectProgressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  projectMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  projectPathway: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  projectPercent: { ...typography.bodyMedium, color: colors.text, marginLeft: spacing.sm },
  projectContinue: {
    minHeight: 40,
    marginTop: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderBottomWidth: 3,
    borderBottomColor: "#7640D4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  projectContinueText: { ...typography.bodyMedium, color: colors.surface, fontSize: 15 },
  moreProjects: { ...typography.body, color: colors.textSecondary, padding: spacing.sm },
  activityGrid: { flexDirection: "row", gap: 4, width: "100%" },
  activityColumn: { flex: 1, gap: 4 },
  activityCell: { width: "100%", aspectRatio: 1, borderRadius: 2 },
  activityEmpty: { backgroundColor: "#F0F0F0" },
  activity1: { backgroundColor: "#E8DAFF" },
  activity2: { backgroundColor: "#C9A8FF" },
  activity3: { backgroundColor: colors.primary },
  monthLabels: { flexDirection: "row", marginTop: spacing.sm },
  monthLabel: { ...typography.bodyMedium, color: "#777777", textAlign: "center", fontSize: 13 },
  activityUnavailable: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  trophyCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  trophyNumber: { ...typography.title, color: colors.text, fontSize: 22 },
  trophyRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  earnedTrophy: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
