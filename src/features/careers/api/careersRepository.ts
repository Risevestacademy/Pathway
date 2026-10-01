import type { CareerLevel } from "@shared/types/domain";
import type { Career, CareerDetail, Pathway } from "../types";
import { CareersApi } from "./careersApi";
import { toCareer, toCareerDetail, toPathway } from "./mappers";

/**
 * Repository abstraction — the UI/store never knows whether it talks to the
 * temporary backend, a mock, or the future production API.
 */
export interface CareersRepository {
  listCareers(params: { level?: CareerLevel; interestSlug?: string }): Promise<Career[]>;
  getCareer(id: string): Promise<CareerDetail>;
  getPathway(careerId: string): Promise<Pathway | null>;
}

export class HttpCareersRepository implements CareersRepository {
  constructor(private readonly api: CareersApi) {}

  async listCareers(params: { level?: CareerLevel; interestSlug?: string }): Promise<Career[]> {
    const dtos = await this.api.listCareers(params);
    return dtos.map(toCareer);
  }

  async getCareer(id: string): Promise<CareerDetail> {
    return toCareerDetail(await this.api.getCareer(id));
  }

  async getPathway(careerId: string): Promise<Pathway | null> {
    const { pathway } = await this.api.getPathway(careerId);
    return pathway ? toPathway(pathway) : null;
  }
}

/** Default singleton used by the app. Swap here (or via env-driven factory)
 *  when the production API ships. */
export const careersRepository: CareersRepository = new HttpCareersRepository(new CareersApi());
