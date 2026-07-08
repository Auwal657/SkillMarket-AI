/**
 * Hand-written extensions to the generated API client.
 * Add hooks and functions here when the generated client is missing them.
 */
import { useMutation } from "@tanstack/react-query";
import type {
  MutationFunction,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import type { PortfolioItem, PortfolioItemInput, Skill } from "./generated/api.schemas";
import { customFetch } from "./custom-fetch";
import type { ErrorType, BodyType } from "./custom-fetch";

// ─── Update Portfolio Item (PATCH) ───────────────────────────────────────────

export const updatePortfolioItem = async (
  itemId: number,
  data: Partial<PortfolioItemInput>,
  options?: RequestInit
): Promise<PortfolioItem> =>
  customFetch<PortfolioItem>(`/api/freelancers/me/portfolio/${itemId}`, {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(data),
  });

export const useUpdatePortfolioItem = <
  TError = ErrorType<unknown>,
  TContext = unknown
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof updatePortfolioItem>>,
      TError,
      { itemId: number; data: BodyType<Partial<PortfolioItemInput>> },
      TContext
    >;
  }
): UseMutationResult<
  Awaited<ReturnType<typeof updatePortfolioItem>>,
  TError,
  { itemId: number; data: BodyType<Partial<PortfolioItemInput>> },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updatePortfolioItem>>,
    { itemId: number; data: BodyType<Partial<PortfolioItemInput>> }
  > = ({ itemId, data }) => updatePortfolioItem(itemId, data);

  return useMutation({
    mutationFn,
    mutationKey: ["updatePortfolioItem"],
    ...options?.mutation,
  });
};

// ─── Create / Find Skill ──────────────────────────────────────────────────────

export interface CreateSkillInput {
  name: string;
  category?: string;
}

export const createSkill = async (
  input: CreateSkillInput,
  options?: RequestInit
): Promise<Skill> =>
  customFetch<Skill>("/api/skills", {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(input),
  });

export const useCreateSkill = <
  TError = ErrorType<unknown>,
  TContext = unknown
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof createSkill>>,
      TError,
      { data: BodyType<CreateSkillInput> },
      TContext
    >;
  }
): UseMutationResult<
  Awaited<ReturnType<typeof createSkill>>,
  TError,
  { data: BodyType<CreateSkillInput> },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createSkill>>,
    { data: BodyType<CreateSkillInput> }
  > = ({ data }) => createSkill(data);

  return useMutation({
    mutationFn,
    mutationKey: ["createSkill"],
    ...options?.mutation,
  });
};
