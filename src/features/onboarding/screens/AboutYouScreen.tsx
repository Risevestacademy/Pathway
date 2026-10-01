import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { usePostHog } from "posthog-react-native";
import { ScreenContainer } from "@shared/components/ScreenContainer";
import { PrimaryButton } from "@shared/components/PrimaryButton";
import { SelectField } from "@shared/components/SelectField";
import { colors, spacing, typography } from "@shared/design-system/tokens";
import type { RootStackParamList } from "@app/navigation/types";
import { useOnboardingStore } from "../store/onboardingStore";
import {
  INTERNSHIP_OPTIONS,
  QUALIFICATION_OPTIONS,
  SKILL_SUGGESTIONS,
  YEARS_OF_WORK_OPTIONS,
} from "../types";
import { TagInput } from "../components/TagInput";

type Props = NativeStackScreenProps<RootStackParamList, "AboutYou">;

export function AboutYouScreen({ navigation }: Props) {
  const posthog = usePostHog();
  const {
    highestQualification,
    setHighestQualification,
    yearsOfWork,
    setYearsOfWork,
    internships,
    setInternships,
    skills,
    addSkill,
    removeSkill,
    interests,
    addInterest,
    removeInterest,
    markSkipped,
  } = useOnboardingStore();

  const showMyCareers = () => {
    posthog.capture("onboarding_details_submitted", {
      has_qualification: highestQualification !== null,
      has_work_experience: yearsOfWork !== null,
      has_internship_experience: internships !== null,
      skill_count: skills.length,
      interest_count: interests.length,
    });
    posthog.logger.info("onboarding details completed", {
      skill_count: skills.length,
      interest_count: interests.length,
      status: "submitted",
    });
    navigation.navigate("Catalogue", { showFiltered: true });
  };

  const skip = () => {
    posthog.capture("onboarding_details_skipped", {
      completed_field_count: [
        highestQualification,
        yearsOfWork,
        internships,
      ].filter((value) => value !== null).length + skills.length + interests.length,
    });
    markSkipped();
    navigation.navigate("Catalogue", { showFiltered: false });
  };

  return (
    <ScreenContainer testID="about-you-screen">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => navigation.goBack()}
        hitSlop={8}
      >
        <Text style={styles.back}>{"< Back"}</Text>
      </Pressable>

      <Text style={styles.step}>Step 2 of 2 - Optional</Text>
      <Text style={styles.title}>Tell us a bit more</Text>
      <Text style={styles.subtitle}>
        Add any of these to see careers that fit you best — or skip to browse everything.
      </Text>

      <Text style={styles.label}>Education</Text>
      <SelectField
        testID="qualification-select"
        placeholder="Highest qualification"
        value={highestQualification}
        options={[...QUALIFICATION_OPTIONS]}
        onChange={setHighestQualification}
      />

      <Text style={styles.label}>Experience</Text>
      <SelectField
        testID="years-select"
        placeholder="Years of work"
        value={yearsOfWork}
        options={[...YEARS_OF_WORK_OPTIONS]}
        onChange={setYearsOfWork}
      />
      <SelectField
        testID="internships-select"
        placeholder="Internships"
        value={internships}
        options={[...INTERNSHIP_OPTIONS]}
        onChange={setInternships}
      />

      <Text style={styles.label}>Skills</Text>
      <TagInput
        testID="skills-input"
        placeholder="Add a skill"
        tags={skills}
        onAdd={addSkill}
        onRemove={removeSkill}
        suggestions={SKILL_SUGGESTIONS}
      />

      <Text style={styles.label}>Career interests</Text>
      <TagInput
        testID="interests-input"
        placeholder="Add an interest"
        tags={interests}
        onAdd={addInterest}
        onRemove={removeInterest}
      />

      <View style={styles.footer}>
        <PrimaryButton title="Show my careers" testID="show-careers-button" onPress={showMyCareers} />
        <Pressable
          accessibilityRole="button"
          onPress={skip}
          testID="skip-button"
          style={styles.skipWrap}
        >
          <Text style={styles.skip}>Skip for now</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.lg },
  step: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  footer: { marginTop: spacing.md, gap: spacing.sm },
  skipWrap: { paddingVertical: spacing.md, alignItems: "center" },
  skip: { ...typography.bodyMedium, color: colors.textSecondary },
});
