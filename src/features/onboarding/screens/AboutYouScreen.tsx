import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePostHog } from "posthog-react-native";
import OnboardIcon from "@app/assets/icons/onboard.svg";
import { SelectField } from "@shared/components/SelectField";
import { colors, radius, spacing, typography } from "@shared/design-system/tokens";
import type { RootStackParamList } from "@app/navigation/types";
import type { SkillDto } from "@features/careers/api/dtos";
import { TagInput } from "../components/TagInput";
import { SkillSelector } from "../components/SkillSelector";
import { skillsApi } from "../api/skillsApi";
import {
  GOAL_OPTIONS,
  INTERNSHIP_OPTIONS,
  PROFESSION_OPTIONS,
  ROADMAP_OPTIONS,
  YEARS_OF_WORK_OPTIONS,
} from "../types";
import { useOnboardingStore } from "../store/onboardingStore";

type Props = NativeStackScreenProps<RootStackParamList, "AboutYou">;

const SKILLS_LOAD_ERROR = "Could not load skills. Check your connection and try again.";

export function AboutYouScreen({ navigation }: Props) {
  const posthog = usePostHog();
  const {
    profession,
    setProfession,
    yearsOfWork,
    setYearsOfWork,
    internships,
    setInternships,
    skills: selectedSkills,
    addSkill,
    removeSkill,
    interests,
    addInterest,
    removeInterest,
    goal,
    setGoal,
    roadmapTime,
    setRoadmapTime,
    markSkipped,
  } = useOnboardingStore();
  const [availableSkills, setAvailableSkills] = useState<SkillDto[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    skillsApi
      .listSkills()
      .then((response) => {
        if (active) setAvailableSkills(response);
      })
      .catch(() => {
        if (active) {
          setAvailableSkills([]);
          setSkillsError(SKILLS_LOAD_ERROR);
        }
      })
      .finally(() => {
        if (active) setSkillsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const showCareers = () => {
    posthog.capture("onboarding_details_submitted", {
      has_profession: profession !== null,
      has_work_experience: yearsOfWork !== null,
      has_internship_experience: internships !== null,
      skill_count: selectedSkills.length,
      interest_count: interests.length,
      has_goal: goal !== null,
      has_roadmap_time: roadmapTime !== null,
    });
    posthog.logger.info("onboarding details completed", {
      skill_count: selectedSkills.length,
      interest_count: interests.length,
      status: "submitted",
    });
    navigation.navigate("Home");
  };

  const skip = () => {
    posthog.capture("onboarding_details_skipped", {
      completed_field_count:
        [profession, yearsOfWork, internships, goal, roadmapTime].filter(Boolean).length +
        selectedSkills.length +
        interests.length,
    });
    markSkipped();
    navigation.navigate("Home");
  };

  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      removeSkill(skillName);
    } else {
      addSkill(skillName);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]} testID="about-you-screen">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <OnboardIcon width={28} height={28} style={styles.icon} />
          <Text style={styles.step}>2/3</Text>
          <Text style={styles.title}>Tell us a bit more...</Text>
          <Text style={styles.subtitle}>
            Add any of these to see careers that fit you best, or skip to browse everything.
          </Text>

          <Text style={styles.label}>Profession</Text>
          <SelectField
            testID="profession-select"
            placeholder="Current profession"
            value={profession}
            options={[...PROFESSION_OPTIONS]}
            onChange={setProfession}
          />

          <View style={styles.labelRow}>
            <Text style={styles.label}>Experience</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Import CV"
              onPress={() => Alert.alert("Import CV", "CV import is not available yet.")}
              hitSlop={8}
            >
              <Text style={styles.importCv}>Import CV</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <SelectField
                testID="years-select"
                placeholder="Years of work"
                value={yearsOfWork}
                options={[...YEARS_OF_WORK_OPTIONS]}
                onChange={setYearsOfWork}
              />
            </View>
            <View style={styles.half}>
              <SelectField
                testID="internships-select"
                placeholder="Internships"
                value={internships}
                options={[...INTERNSHIP_OPTIONS]}
                onChange={setInternships}
              />
            </View>
          </View>

          <Text style={styles.label}>Skills</Text>
          <TagInput
            testID="skills-input"
            placeholder="Add a skill"
            tags={selectedSkills}
            onAdd={addSkill}
            onRemove={removeSkill}
          />

          <Text style={styles.label}>Career interests <Text style={styles.optional}>(Optional)</Text></Text>
          <TagInput
            testID="interests-input"
            placeholder="Add interests"
            tags={interests}
            onAdd={addInterest}
            onRemove={removeInterest}
          />

          <View style={styles.sectionDivider} />
          <OnboardIcon width={28} height={28} style={styles.icon} />
          <Text style={styles.step}>3/3</Text>
          <Text style={styles.title}>Tell us a bit more...</Text>
          <Text style={styles.subtitle}>
            Add any of these to see careers that fit you best, or skip to browse everything.
          </Text>

          <Text style={styles.label}>Skills Required</Text>
          <SkillSelector
            skills={availableSkills}
            selectedSkills={selectedSkills}
            loading={skillsLoading}
            error={skillsError}
            onToggle={toggleSkill}
            onRetry={() => {
              setSkillsLoading(true);
              setSkillsError(null);
              setLoadAttempt((attempt) => attempt + 1);
            }}
          />
          <Text style={styles.hint}>Pick skills you currently have</Text>

          <Text style={styles.label}>Goals <Text style={styles.optional}>(Optional)</Text></Text>
          <SelectField
            testID="goal-select"
            placeholder="Select possible goals for career interests"
            value={goal}
            options={[...GOAL_OPTIONS]}
            onChange={setGoal}
          />

          <Text style={styles.label}>Roadmap <Text style={styles.optional}>(Optional)</Text></Text>
          <SelectField
            testID="roadmap-select"
            placeholder="Select time commitment to your pathway"
            value={roadmapTime}
            options={[...ROADMAP_OPTIONS]}
            onChange={setRoadmapTime}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
            onPress={skip}
            testID="skip-button"
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show careers"
            onPress={showCareers}
            testID="show-careers-button"
            style={styles.showButton}
          >
            <Text style={styles.showText}>Show careers</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: 28,
  },
  icon: { marginBottom: spacing.md },
  step: { ...typography.caption, color: colors.primary, marginBottom: spacing.xs },
  title: { ...typography.sectionTitle, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xl },
  label: { ...typography.caption, color: colors.text, fontWeight: "600", marginBottom: spacing.sm },
  optional: { color: colors.textTertiary, fontWeight: "400" },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  importCv: { ...typography.caption, color: colors.primary, marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  half: { flex: 1 },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.md },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  skipButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  skipText: { ...typography.bodyMedium, color: colors.textSecondary },
  showButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  showText: { ...typography.bodyMedium, color: colors.surface },
});
