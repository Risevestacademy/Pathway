import { apiGet } from "@shared/api/client";
import type { SkillDto } from "@features/careers/api/dtos";

export class SkillsApi {
  listSkills(): Promise<SkillDto[]> {
    return apiGet<SkillDto[]>("/api/v1/skills");
  }
}

export const skillsApi = new SkillsApi();
