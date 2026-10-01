import { apiGet } from "@shared/api/client";
import type { CareerLevel } from "@shared/types/domain";
import type {
  CareerDetailDto,
  CareerListItemDto,
  PathwayResponseDto,
} from "./dtos";

export interface ListCareersParams {
  level?: CareerLevel;
  interestSlug?: string;
}

/** HTTP adapter for the temporary careers endpoints. */
export class CareersApi {
  listCareers(params: ListCareersParams): Promise<CareerListItemDto[]> {
    const query: string[] = [];
    if (params.level) query.push(`level=${encodeURIComponent(params.level)}`);
    if (params.interestSlug) query.push(`interest=${encodeURIComponent(params.interestSlug)}`);
    const suffix = query.length > 0 ? `?${query.join("&")}` : "";
    return apiGet<CareerListItemDto[]>(`/api/v1/careers${suffix}`);
  }

  getCareer(id: string): Promise<CareerDetailDto> {
    return apiGet<CareerDetailDto>(`/api/v1/careers/${id}`);
  }

  getPathway(careerId: string): Promise<PathwayResponseDto> {
    return apiGet<PathwayResponseDto>(`/api/v1/careers/${careerId}/pathway`);
  }
}
