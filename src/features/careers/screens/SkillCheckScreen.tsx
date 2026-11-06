import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { SvgProps } from "react-native-svg";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import BackendIcon from "@app/assets/icons/backend.svg";
import DataEngineeringIcon from "@app/assets/icons/dataeng.svg";
import DesignerIcon from "@app/assets/icons/designer.svg";
import FrontendIcon from "@app/assets/icons/frontend.svg";
import ProductIcon from "@app/assets/icons/product.svg";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import { EmptyState } from "@shared/components/EmptyState";
import { ErrorState } from "@shared/components/ErrorState";
import type { RootStackParamList } from "@app/navigation/types";
import { careersRepository } from "../api/careersRepository";
import type { Career } from "../types";
import { DashboardScreenFrame } from "@features/dashboard/components/DashboardScreenFrame";
import { navigateToDashboardTab } from "@features/dashboard/navigation";
import type { DashboardTab } from "@features/dashboard/types";

type Props = NativeStackScreenProps<RootStackParamList, "PathwayTab">;
type SkillRating = "have" | "notYet" | "notSure";
type ScreenMode = "catalogue" | "skills" | "summary";
type Skill = { name: string; description: string };
type SkillCategory = { title: string; skills: Skill[] };

const ratingOptions: { value: SkillRating; label: string }[] = [
  { value: "have", label: "Have" },
  { value: "notYet", label: "Not yet" },
  { value: "notSure", label: "Not sure" },
];

const sampleCategories: SkillCategory[] = [
  {
    title: "Core Web",
    skills: [
      { name: "HTML", description: "Structure pages with the right elements." },
      { name: "CSS", description: "Style and lay out pages, including responsive layouts." },
      {
        name: "JavaScript fundamentals",
        description: "Variables, functions, events and working with the DOM.",
      },
    ],
  },
  {
    title: "UI frameworks",
    skills: [
      { name: "Component-based UI", description: "Build interfaces from reusable components." },
      { name: "State and data", description: "Keep an interface in sync with changing data." },
      { name: "Accessibility", description: "Make interfaces usable by a wide range of people." },
    ],
  },
  {
    title: "Testing and tooling",
    skills: [
      { name: "Version control", description: "Track changes and collaborate with Git." },
      { name: "UI testing", description: "Check that important user flows work as expected." },
      { name: "Debugging", description: "Find and fix issues in a web application." },
    ],
  },
];

const careerColors = [
  { background: "#E7EAFE", icon: "#4361D8", name: "code-slash-outline" },
  { background: "#E2F6E7", icon: "#2D9B50", name: "server-outline" },
  { background: "#FCE4EF", icon: "#D64C83", name: "color-palette-outline" },
  { background: "#FFF3D2", icon: "#D8A318", name: "bar-chart-outline" },
  { background: "#E1F4FA", icon: "#1787A7", name: "sync-outline" },
] as const;

function getCareerIcon(title: string): React.ComponentType<SvgProps> | null {
  const careerTitle = title.toLowerCase();

  if (careerTitle.includes("frontend")) return FrontendIcon;
  if (careerTitle.includes("backend")) return BackendIcon;
  if (careerTitle.includes("data analyst")) return DataEngineeringIcon;
  if (
    careerTitle.includes("ui/ux") ||
    careerTitle.includes("ux") ||
    careerTitle.includes("ui designer")
  ) {
    return DesignerIcon;
  }
  if (careerTitle.includes("qa engineer")) return ProductIcon;
  return null;
}

function getSkillCategories(career: Career): SkillCategory[] {
  if (career.title.toLowerCase().includes("frontend")) return sampleCategories;

  const domain = career.title.toLowerCase().includes("designer")
    ? "design"
    : career.title.toLowerCase().includes("data")
      ? "data"
      : career.title.toLowerCase().includes("devops")
        ? "operations"
        : "engineering";

  const skillsByDomain: Record<string, SkillCategory[]> = {
    design: [
      {
        title: "Design foundations",
        skills: [
          { name: "Visual hierarchy", description: "Guide attention with layout, type and contrast." },
          { name: "User research", description: "Learn about people and the problems they face." },
          { name: "Wireframing", description: "Explore page structure before visual polish." },
        ],
      },
      {
        title: "Prototyping",
        skills: [
          { name: "Interaction design", description: "Make controls and flows clear and predictable." },
          { name: "Design systems", description: "Create consistent reusable interface patterns." },
          { name: "Usability testing", description: "Learn where people get stuck in a design." },
        ],
      },
      sampleCategories[2],
    ],
    data: [
      {
        title: "Data foundations",
        skills: [
          { name: "Spreadsheets", description: "Organize and inspect tabular data." },
          { name: "SQL basics", description: "Find and summarize data with queries." },
          { name: "Data cleaning", description: "Prepare reliable data for analysis." },
        ],
      },
      {
        title: "Analysis",
        skills: [
          { name: "Descriptive statistics", description: "Summarize patterns and distributions." },
          { name: "Data visualization", description: "Communicate findings with clear charts." },
          { name: "Dashboard design", description: "Build useful views of key measures." },
        ],
      },
      sampleCategories[2],
    ],
    operations: [
      {
        title: "Infrastructure",
        skills: [
          { name: "Linux fundamentals", description: "Work confidently with a Linux environment." },
          { name: "Networking basics", description: "Understand how services communicate." },
          { name: "Cloud services", description: "Use cloud infrastructure to run applications." },
        ],
      },
      {
        title: "Delivery",
        skills: [
          { name: "CI/CD", description: "Automate build, test and deployment workflows." },
          { name: "Containers", description: "Package applications and their dependencies." },
          { name: "Infrastructure as code", description: "Manage infrastructure through versioned code." },
        ],
      },
      sampleCategories[2],
    ],
    engineering: [
      {
        title: "Core technologies",
        skills: [
          { name: "Programming fundamentals", description: "Use variables, functions and data structures." },
          { name: "APIs and data", description: "Build and connect services that exchange data." },
          { name: "Version control", description: "Track changes and collaborate with Git." },
        ],
      },
      {
        title: "Building software",
        skills: [
          { name: "Testing", description: "Check that software works as expected." },
          { name: "Debugging", description: "Find and fix issues in an application." },
          { name: "System design", description: "Break down a system into reliable components." },
        ],
      },
      sampleCategories[2],
    ],
  };

  return skillsByDomain[domain];
}

export function SkillCheckScreen({ navigation }: Pick<Props, "navigation">) {
  const insets = useSafeAreaInsets();
  const [careers, setCareers] = useState<Career[]>([]);
  const [listStatus, setListStatus] = useState<"loading" | "success" | "error">("loading");
  const [mode, setMode] = useState<ScreenMode>("catalogue");
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, SkillRating>>({});
  const [modal, setModal] = useState<"intro" | "saved" | null>(null);

  const loadCareers = async () => {
    setListStatus("loading");
    try {
      const results = await careersRepository.listCareers({});
      setCareers(results);
      setListStatus("success");
    } catch {
      setListStatus("error");
    }
  };

  useEffect(() => {
    let isCurrent = true;
    careersRepository
      .listCareers({})
      .then((results) => {
        if (isCurrent) {
          setCareers(results);
          setListStatus("success");
        }
      })
      .catch(() => {
        if (isCurrent) setListStatus("error");
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const categories = useMemo(
    () => (selectedCareer ? getSkillCategories(selectedCareer) : []),
    [selectedCareer],
  );
  const allSkills = useMemo(
    () =>
      categories.flatMap((category, index) =>
        category.skills.map((skill) => ({ ...skill, categoryIndex: index })),
      ),
    [categories],
  );
  const ratingFor = (skillName: string) =>
    selectedCareer ? ratings[`${selectedCareer.id}:${skillName}`] : undefined;
  const answeredCount = allSkills.filter((skill) => ratingFor(skill.name) !== undefined).length;
  const haveCount = allSkills.filter((skill) => ratingFor(skill.name) === "have").length;
  const notYetCount = allSkills.filter((skill) => ratingFor(skill.name) === "notYet").length;
  const notSureCount = allSkills.filter((skill) => ratingFor(skill.name) === "notSure").length;
  const firstGap = allSkills.find((skill) => ratingFor(skill.name) === "notYet");
  const nextSkill = firstGap ?? allSkills.find((skill) => ratingFor(skill.name) === undefined);
  const SelectedCareerIcon = selectedCareer ? getCareerIcon(selectedCareer.title) : null;

  const startSkillCheck = () => {
    setCategoryIndex(0);
    setMode("skills");
    setModal(null);
  };

  const selectTab = (tab: DashboardTab) => navigateToDashboardTab(navigation, tab);

  const renderCatalogue = () => (
    <DashboardScreenFrame activeTab="Pathway" onSelectTab={selectTab}>
      <ScrollView
        contentContainerStyle={styles.catalogueContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.catalogueTitle}>Skill Check</Text>
        <Text style={styles.catalogueSubtitle}>
          See your existing skills and career gaps, based on what you share.
        </Text>

        {listStatus === "loading" ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.body}>Loading careers…</Text>
          </View>
        ) : listStatus === "error" ? (
          <ErrorState
            title={"We couldn't load careers"}
            message="Something went wrong on our side or with your connection. Please try again."
            onRetry={() => void loadCareers()}
          />
        ) : careers.length === 0 ? (
          <EmptyState
            icon="briefcase-outline"
            title="No careers available yet"
            message="We're adding careers to the catalogue. Check back soon."
          />
        ) : (
          <>
            <Text style={styles.careerCount} testID="skill-check-career-count">
              {careers.length} {careers.length === 1 ? "career" : "careers"}
            </Text>
            <View style={styles.careerGrid}>
              {careers.map((career, index) => {
                const color = careerColors[index % careerColors.length];
                const CareerIcon = getCareerIcon(career.title);
                const careerIconStyle = { backgroundColor: color.background };
                return (
                  <Pressable
                    key={career.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Check your skills for ${career.title}`}
                    onPress={() => {
                      setSelectedCareer(career);
                      setModal("intro");
                    }}
                    style={({ pressed }) => [styles.careerCard, pressed && styles.pressedCard]}
                    testID={`skill-check-career-${career.id}`}
                  >
                    <View style={[styles.careerIcon, careerIconStyle]}>
                      {CareerIcon ? (
                        <CareerIcon
                          width={40}
                          height={40}
                          style={styles.careerSvg}
                          accessible={false}
                        />
                      ) : (
                        <Ionicons name={color.name} size={28} color={color.icon} />
                      )}
                    </View>
                    <View style={styles.careerCardFooter}>
                      <Text style={styles.careerName}>{career.title}</Text>
                      <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
      {renderModal()}
    </DashboardScreenFrame>
  );

  const renderModal = () => (
    <Modal
      visible={modal !== null}
      transparent
      animationType="slide"
      onRequestClose={() => setModal(null)}
    >
      <View style={styles.modalBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          onPress={() => setModal(null)}
          style={StyleSheet.absoluteFill}
        />
        {modal === "intro" ? (
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.xxxl) + spacing.xl },
            ]}
          >
            <View style={styles.sheetTop}>
              <View style={[styles.careerIcon, styles.modalCareerIcon]}>
                {SelectedCareerIcon ? (
                  <SelectedCareerIcon width={64} height={64} />
                ) : (
                  <Ionicons name="code-slash-outline" size={30} color={colors.primaryDark} />
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setModal(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.sheetTitle}>Check your skills for</Text>
            <Text style={styles.sheetCareer}>{selectedCareer?.title}</Text>
            <View style={styles.benefitBox}>
              <Benefit icon="list" text="Mark the skills as follows; Have, Not Yet, or Not Sure." />
              <Benefit icon="school" text="See your gaps, each linked to a pathway step. That way, you can complete it." />
              <Benefit icon="flag" text="Get a suggested starting point for upgrading your skills." />
            </View>
            <View style={styles.duration}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
              <Text style={styles.durationText}>Takes about 3 minutes</Text>
            </View>
            <View style={styles.modalActions}>
              <ActionButton title="Not now" onPress={() => setModal(null)} secondary />
              <ActionButton
                title="Start"
                icon="arrow-forward"
                onPress={startSkillCheck}
                testID="start-skill-check"
              />
            </View>
          </View>
        ) : modal === "saved" ? (
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, spacing.xxxl) + spacing.xl },
            ]}
          >
            <View style={styles.sheetTop}>
              <View style={[styles.careerIcon, styles.savedIcon]}>
                <Ionicons name="albums-outline" size={28} color={colors.primary} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setModal(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.sheetTitle}>Progress saved for this session</Text>
            <Text style={styles.savedDescription}>
              You have answered {answeredCount} of {allSkills.length} skills. Your answers will
              remain available while this Skill Check is open.
            </Text>
            <View style={styles.modalActions}>
              <ActionButton
                title="Go back"
                secondary
                onPress={() => {
                  setModal(null);
                  setMode("catalogue");
                }}
              />
              <ActionButton title="Keep going" onPress={() => setModal(null)} />
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );

  if (mode === "catalogue") return renderCatalogue();

  if (!selectedCareer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.pageContent}>
          <EmptyState
            icon="briefcase-outline"
            title="Choose a career"
            message="Go back to the career list to start a Skill Check."
          />
          <ActionButton title="Back to careers" onPress={() => setMode("catalogue")} />
        </View>
      </SafeAreaView>
    );
  }

  if (mode === "summary") {
    return (
      <SafeAreaView style={styles.safeArea} testID="skill-check-summary">
        <View style={styles.pageContent}>
          <ScrollView
            contentContainerStyle={styles.summaryContent}
            showsVerticalScrollIndicator={false}
          >
            <BackButton onPress={() => setMode("skills")} />
            <Text style={styles.careerEyebrow}>{selectedCareer.title}</Text>
            <Text style={styles.pageTitle}>Your current proficiency...</Text>
            <Text style={styles.pageSubtitle}>
              Based on what you told us. Self-reported, not a test or a certification.
            </Text>

            <View style={styles.statsRow}>
              <ProficiencyStat label="Have" count={haveCount} tone="have" />
              <ProficiencyStat label="Not Yet" count={notYetCount} tone="notYet" />
              <ProficiencyStat label="Not sure" count={notSureCount} tone="notSure" />
            </View>

            {nextSkill ? (
              <View style={styles.recommendation}>
                <Text style={styles.recommendationTitle}>
                  {firstGap ? "Start" : "Continue"} at Step {nextSkill.categoryIndex + 1},{" "}
                  {nextSkill.name}
                </Text>
                <Text style={styles.recommendationText}>
                  {firstGap
                    ? "Why: your answers show this is a skill to work on next."
                    : "Finish the Skill Check to get a suggested starting point."}
                </Text>
                <ActionButton
                  title={firstGap ? "Start" : "Continue"}
                  icon="arrow-forward"
                  onPress={() => {
                    setCategoryIndex(nextSkill.categoryIndex);
                    setMode("skills");
                  }}
                  compact
                />
              </View>
            ) : (
              <View style={styles.recommendation}>
                <Text style={styles.recommendationTitle}>Your Skill Check is complete</Text>
                <Text style={styles.recommendationText}>
                  You marked {haveCount} skills as ones you already have.
                </Text>
              </View>
            )}

            <View style={styles.gapsList}>
              {allSkills
                .filter((skill) => ratingFor(skill.name) === "notYet")
                .map((skill) => (
                  <View key={skill.name} style={styles.gapRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{skill.categoryIndex + 1}</Text>
                    </View>
                    <View style={styles.gapContent}>
                      <Text style={styles.gapTitle}>{skill.name}</Text>
                      <Text style={styles.gapDescription}>{skill.description}</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          setCategoryIndex(skill.categoryIndex);
                          setMode("skills");
                        }}
                        style={styles.lessonLink}
                      >
                        <Text style={styles.lessonLinkText}>Review this skill</Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                      </Pressable>
                    </View>
                  </View>
                ))}
            </View>
          </ScrollView>
          <View style={styles.footerSingle}>
            <ActionButton title="Back to skills" secondary onPress={() => setMode("skills")} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const currentCategory = categories[categoryIndex];

  return (
    <SafeAreaView style={styles.safeArea} testID="skill-check-questions">
      <View style={styles.pageContent}>
        <ScrollView
          contentContainerStyle={styles.skillsContent}
          showsVerticalScrollIndicator={false}
        >
          <BackButton
            onPress={() => {
              if (categoryIndex > 0) setCategoryIndex(categoryIndex - 1);
              else setMode("catalogue");
            }}
          />
          <Text style={styles.careerEyebrow}>{selectedCareer.title}</Text>
          <Text style={styles.pageTitle}>{currentCategory?.title}</Text>
          <Text style={styles.pageSubtitle}>Choose what you can do. Not sure is a fine answer.</Text>

          <View style={styles.skillList}>
            {currentCategory?.skills.map((skill, index) => {
              const selectedRating = ratingFor(skill.name);
              const ratingId = `${selectedCareer.id}:${skill.name}`;
              return (
                <View
                  key={skill.name}
                  style={[
                    styles.skillCard,
                    index < currentCategory.skills.length - 1 && styles.skillDivider,
                  ]}
                >
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <Text style={styles.skillDescription}>{skill.description}</Text>
                  <View style={styles.ratingControl}>
                    {ratingOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        accessibilityLabel={`${skill.name}: ${option.label}`}
                        accessibilityState={{ selected: selectedRating === option.value }}
                        onPress={() =>
                          setRatings((current) => ({ ...current, [ratingId]: option.value }))
                        }
                        style={[
                          styles.ratingOption,
                          selectedRating === option.value && styles[`rating_${option.value}`],
                        ]}
                      >
                        <Text
                          style={[
                            styles.ratingLabel,
                            selectedRating === option.value && styles[`ratingText_${option.value}`],
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={styles.helpBox}>
            <Ionicons name="information-circle-outline" size={21} color={colors.textSecondary} />
            <Text style={styles.helpText}>
              Have means you could do it on a real project without looking everything up. Not yet
              means you are still learning. Not sure is fine too.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous category"
            disabled={categoryIndex === 0}
            onPress={() => setCategoryIndex((index) => Math.max(0, index - 1))}
            style={styles.stepperButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={categoryIndex === 0 ? colors.border : colors.textSecondary}
            />
          </Pressable>
          <View style={styles.stepperLabel}>
            <Text style={styles.stepperTitle}>{currentCategory?.title}</Text>
            <Text style={styles.stepperCount}>
              {categoryIndex + 1} of {categories.length}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next category"
            disabled={categoryIndex === categories.length - 1}
            onPress={() =>
              setCategoryIndex((index) => Math.min(categories.length - 1, index + 1))
            }
            style={styles.stepperButton}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={categoryIndex === categories.length - 1 ? colors.border : colors.textSecondary}
            />
          </Pressable>
        </View>

        <View style={styles.footerActions}>
          <ActionButton title="Save and exit" secondary onPress={() => setModal("saved")} />
          <ActionButton
            title={categoryIndex === categories.length - 1 ? "See results" : "Continue"}
            icon="arrow-forward"
            onPress={() => {
              if (categoryIndex < categories.length - 1) setCategoryIndex((index) => index + 1);
              else setMode("summary");
            }}
          />
        </View>
      </View>
      {renderModal()}
    </SafeAreaView>
  );
}

function Benefit({ icon, text }: { icon: "list" | "school" | "flag"; text: string }) {
  return (
    <View style={styles.benefit}>
      <Ionicons name={icon} size={20} color={colors.textTertiary} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  secondary = false,
  icon,
  compact = false,
  testID,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  icon?: "arrow-forward";
  compact?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary ? styles.secondaryAction : styles.primaryAction,
        compact && styles.compactAction,
        pressed && styles.actionPressed,
      ]}
    >
      <Text style={[styles.actionText, secondary && styles.secondaryActionText]}>{title}</Text>
      {icon ? (
        <Ionicons
          name={icon}
          size={21}
          color={secondary ? colors.textSecondary : colors.surface}
        />
      ) : null}
    </Pressable>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.backButton}>
      <Ionicons name="chevron-back" size={19} color={colors.textSecondary} />
      <Text style={styles.backLabel}>Back</Text>
    </Pressable>
  );
}

function ProficiencyStat({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: SkillRating;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statLabel, styles[`stat_${tone}`]]}>
        <Text style={[styles.statLabelText, styles[`statText_${tone}`]]}>{label}</Text>
      </View>
      <Text style={styles.statCount}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  pageContent: { flex: 1 },
  catalogueContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  catalogueTitle: { ...typography.title, fontSize: 26, lineHeight: 32, color: colors.text },
  catalogueSubtitle: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  careerCount: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  careerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  careerCard: {
    width: "48%",
    minHeight: 176,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: "space-between",
    backgroundColor: colors.surface,
  },
  pressedCard: { backgroundColor: "#FAFAFC" },
  careerIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  careerSvg: { width: 40, height: 40 },
  careerCardFooter: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  careerName: { ...typography.sectionTitle, fontSize: 16, lineHeight: 21, color: colors.text, flex: 1 },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxxl,
  },
  body: { ...typography.body, color: colors.textSecondary },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  sheetTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalCareerIcon: { width: 64, height: 64, backgroundColor: colors.primarySoft },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { ...typography.title, fontSize: 21, lineHeight: 28, color: colors.text },
  sheetCareer: {
    ...typography.title,
    fontSize: 21,
    lineHeight: 28,
    color: colors.textSecondary,
    marginTop: -spacing.md,
  },
  benefitBox: {
    borderWidth: 1,
    borderColor: "#F0F0F2",
    backgroundColor: "#FAFAFB",
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  benefit: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  benefitText: { ...typography.body, fontSize: 15, lineHeight: 22, color: colors.textSecondary, flex: 1 },
  duration: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  durationText: { ...typography.body, color: colors.textTertiary },
  modalActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  actionButton: {
    minHeight: 50,
    flex: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  primaryAction: { backgroundColor: colors.primary },
  secondaryAction: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  compactAction: { flex: 0, alignSelf: "flex-start", minHeight: 42, paddingHorizontal: spacing.lg },
  actionPressed: { opacity: 0.82 },
  actionText: { ...typography.button, color: colors.surface },
  secondaryActionText: { color: colors.textSecondary },
  savedIcon: { backgroundColor: colors.primarySoft },
  savedDescription: { ...typography.body, fontSize: 15, lineHeight: 23, color: colors.textSecondary, marginVertical: spacing.sm },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    marginBottom: spacing.lg,
  },
  backLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  skillsContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  summaryContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  careerEyebrow: { ...typography.bodyMedium, color: colors.primary, fontSize: 15, marginBottom: spacing.xs },
  pageTitle: { ...typography.title, fontSize: 25, lineHeight: 31, color: colors.text, marginBottom: spacing.sm },
  pageSubtitle: { ...typography.body, fontSize: 16, lineHeight: 23, color: colors.textSecondary, marginBottom: spacing.xl },
  skillList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  skillCard: { padding: spacing.lg },
  skillDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  skillName: { ...typography.sectionTitle, fontSize: 16, lineHeight: 22, color: colors.text, marginBottom: spacing.xs },
  skillDescription: { ...typography.body, fontSize: 14, lineHeight: 21, color: colors.textSecondary, marginBottom: spacing.md },
  ratingControl: {
    flexDirection: "row",
    padding: 3,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  ratingOption: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  ratingLabel: { ...typography.bodyMedium, color: colors.textSecondary },
  rating_have: { backgroundColor: "#D1FAE5" },
  rating_notYet: { backgroundColor: "#FEF3D5" },
  rating_notSure: { backgroundColor: "#DCEFFC" },
  ratingText_have: { color: "#16804A" },
  ratingText_notYet: { color: "#B98200" },
  ratingText_notSure: { color: "#2174A6" },
  helpBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#F3F4F6",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  helpText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  stepper: {
    minHeight: 66,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: "#F0F0F2",
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  stepperButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperLabel: { alignItems: "center", flex: 1 },
  stepperTitle: { ...typography.bodyMedium, fontSize: 16, color: colors.text },
  stepperCount: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  footerActions: { flexDirection: "row", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  footerSingle: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    minHeight: 124,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  statLabel: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  stat_have: { backgroundColor: "#D1FAE5" },
  stat_notYet: { backgroundColor: "#FEF3D5" },
  stat_notSure: { backgroundColor: "#E5E7EB" },
  statLabelText: { ...typography.caption, fontSize: 13 },
  statText_have: { color: "#16804A" },
  statText_notYet: { color: "#B98200" },
  statText_notSure: { color: colors.textSecondary },
  statCount: { ...typography.title, fontSize: 28, color: colors.text },
  recommendation: {
    borderWidth: 1,
    borderColor: "#E9D5FF",
    backgroundColor: "#F7F0FF",
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  recommendationTitle: { ...typography.sectionTitle, color: colors.text },
  recommendationText: { ...typography.body, color: colors.textSecondary },
  gapsList: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: "hidden" },
  gapRow: { flexDirection: "row", gap: spacing.md, padding: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  stepBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: "#D8B4FE",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { ...typography.bodyMedium, color: colors.primary },
  gapContent: { flex: 1, gap: spacing.xs },
  gapTitle: { ...typography.sectionTitle, color: colors.text },
  gapDescription: { ...typography.body, color: colors.textSecondary },
  lessonLink: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs, alignSelf: "flex-start" },
  lessonLinkText: { ...typography.bodyMedium, color: colors.primary },
});
