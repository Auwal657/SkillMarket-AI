import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ProjectFreelancerRecommendations, AiRecommendation, Application, ApplicationInput, ApplicationStatusUpdate, AuthResponse, ClientDashboard, ErrorResponse, FreelancerDashboard, FreelancerProfile, FreelancerProfileInput, FreelancerProfileUpdate, FreelancerSkill, HealthStatus, ListFreelancersParams, ListProjectsParams, LoginInput, MessageResponse, PortfolioItem, PortfolioItemInput, Project, ProjectInput, ProjectUpdate, RegisterInput, Skill, SkillInput, User, UserUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRegisterUrl: () => string;
/**
 * @summary Register a new user
 */
export declare const register: (registerInput: RegisterInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getRegisterMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
export type RegisterMutationResult = NonNullable<Awaited<ReturnType<typeof register>>>;
export type RegisterMutationBody = BodyType<RegisterInput>;
export type RegisterMutationError = ErrorType<ErrorResponse>;
/**
* @summary Register a new user
*/
export declare const useRegister: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
export declare const getLoginUrl: () => string;
/**
 * @summary Login
 */
export declare const login: (loginInput: LoginInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginInput>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
* @summary Login
*/
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export declare const getLogoutUrl: () => string;
/**
 * @summary Logout
 */
export declare const logout: (options?: RequestInit) => Promise<MessageResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
* @summary Logout
*/
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export declare const getGetMeUrl: () => string;
/**
 * @summary Get current authenticated user
 */
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current authenticated user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetUserUrl: (id: number) => string;
/**
 * @summary Get a user by ID
 */
export declare const getUser: (id: number, options?: RequestInit) => Promise<User>;
export declare const getGetUserQueryKey: (id: number) => readonly [`/api/users/${number}`];
export declare const getGetUserQueryOptions: <TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserQueryResult = NonNullable<Awaited<ReturnType<typeof getUser>>>;
export type GetUserQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a user by ID
 */
export declare function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateUserUrl: (id: number) => string;
/**
 * @summary Update current user profile
 */
export declare const updateUser: (id: number, userUpdate: UserUpdate, options?: RequestInit) => Promise<User>;
export declare const getUpdateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UserUpdate>;
}, TContext>;
export type UpdateUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateUser>>>;
export type UpdateUserMutationBody = BodyType<UserUpdate>;
export type UpdateUserMutationError = ErrorType<unknown>;
/**
* @summary Update current user profile
*/
export declare const useUpdateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UserUpdate>;
}, TContext>;
export declare const getListFreelancersUrl: (params?: ListFreelancersParams) => string;
/**
 * @summary List freelancer profiles
 */
export declare const listFreelancers: (params?: ListFreelancersParams, options?: RequestInit) => Promise<FreelancerProfile[]>;
export declare const getListFreelancersQueryKey: (params?: ListFreelancersParams) => readonly ["/api/freelancers", ...ListFreelancersParams[]];
export declare const getListFreelancersQueryOptions: <TData = Awaited<ReturnType<typeof listFreelancers>>, TError = ErrorType<unknown>>(params?: ListFreelancersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listFreelancers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listFreelancers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListFreelancersQueryResult = NonNullable<Awaited<ReturnType<typeof listFreelancers>>>;
export type ListFreelancersQueryError = ErrorType<unknown>;
/**
 * @summary List freelancer profiles
 */
export declare function useListFreelancers<TData = Awaited<ReturnType<typeof listFreelancers>>, TError = ErrorType<unknown>>(params?: ListFreelancersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listFreelancers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetFreelancerUrl: (id: number) => string;
/**
 * @summary Get freelancer profile by ID
 */
export declare const getFreelancer: (id: number, options?: RequestInit) => Promise<FreelancerProfile>;
export declare const getGetFreelancerQueryKey: (id: number) => readonly [`/api/freelancers/${number}`];
export declare const getGetFreelancerQueryOptions: <TData = Awaited<ReturnType<typeof getFreelancer>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFreelancer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFreelancer>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFreelancerQueryResult = NonNullable<Awaited<ReturnType<typeof getFreelancer>>>;
export type GetFreelancerQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get freelancer profile by ID
 */
export declare function useGetFreelancer<TData = Awaited<ReturnType<typeof getFreelancer>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFreelancer>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMyFreelancerProfileUrl: () => string;
/**
 * @summary Get the current user's freelancer profile
 */
export declare const getMyFreelancerProfile: (options?: RequestInit) => Promise<FreelancerProfile>;
export declare const getGetMyFreelancerProfileQueryKey: () => readonly ["/api/freelancers/me"];
export declare const getGetMyFreelancerProfileQueryOptions: <TData = Awaited<ReturnType<typeof getMyFreelancerProfile>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyFreelancerProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyFreelancerProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyFreelancerProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getMyFreelancerProfile>>>;
export type GetMyFreelancerProfileQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get the current user's freelancer profile
 */
export declare function useGetMyFreelancerProfile<TData = Awaited<ReturnType<typeof getMyFreelancerProfile>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyFreelancerProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateFreelancerProfileUrl: () => string;
/**
 * @summary Create a freelancer profile for the current user
 */
export declare const createFreelancerProfile: (freelancerProfileInput: FreelancerProfileInput, options?: RequestInit) => Promise<FreelancerProfile>;
export declare const getCreateFreelancerProfileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createFreelancerProfile>>, TError, {
        data: BodyType<FreelancerProfileInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createFreelancerProfile>>, TError, {
    data: BodyType<FreelancerProfileInput>;
}, TContext>;
export type CreateFreelancerProfileMutationResult = NonNullable<Awaited<ReturnType<typeof createFreelancerProfile>>>;
export type CreateFreelancerProfileMutationBody = BodyType<FreelancerProfileInput>;
export type CreateFreelancerProfileMutationError = ErrorType<unknown>;
/**
* @summary Create a freelancer profile for the current user
*/
export declare const useCreateFreelancerProfile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createFreelancerProfile>>, TError, {
        data: BodyType<FreelancerProfileInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createFreelancerProfile>>, TError, {
    data: BodyType<FreelancerProfileInput>;
}, TContext>;
export declare const getUpdateFreelancerProfileUrl: () => string;
/**
 * @summary Update the current user's freelancer profile
 */
export declare const updateFreelancerProfile: (freelancerProfileUpdate: FreelancerProfileUpdate, options?: RequestInit) => Promise<FreelancerProfile>;
export declare const getUpdateFreelancerProfileMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateFreelancerProfile>>, TError, {
        data: BodyType<FreelancerProfileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateFreelancerProfile>>, TError, {
    data: BodyType<FreelancerProfileUpdate>;
}, TContext>;
export type UpdateFreelancerProfileMutationResult = NonNullable<Awaited<ReturnType<typeof updateFreelancerProfile>>>;
export type UpdateFreelancerProfileMutationBody = BodyType<FreelancerProfileUpdate>;
export type UpdateFreelancerProfileMutationError = ErrorType<unknown>;
/**
* @summary Update the current user's freelancer profile
*/
export declare const useUpdateFreelancerProfile: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateFreelancerProfile>>, TError, {
        data: BodyType<FreelancerProfileUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateFreelancerProfile>>, TError, {
    data: BodyType<FreelancerProfileUpdate>;
}, TContext>;
export declare const getListSkillsUrl: () => string;
/**
 * @summary List all available skills
 */
export declare const listSkills: (options?: RequestInit) => Promise<Skill[]>;
export declare const getListSkillsQueryKey: () => readonly ["/api/skills"];
export declare const getListSkillsQueryOptions: <TData = Awaited<ReturnType<typeof listSkills>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSkills>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSkills>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSkillsQueryResult = NonNullable<Awaited<ReturnType<typeof listSkills>>>;
export type ListSkillsQueryError = ErrorType<unknown>;
/**
 * @summary List all available skills
 */
export declare function useListSkills<TData = Awaited<ReturnType<typeof listSkills>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSkills>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListMySkillsUrl: () => string;
/**
 * @summary List skills for the current freelancer
 */
export declare const listMySkills: (options?: RequestInit) => Promise<FreelancerSkill[]>;
export declare const getListMySkillsQueryKey: () => readonly ["/api/freelancers/me/skills"];
export declare const getListMySkillsQueryOptions: <TData = Awaited<ReturnType<typeof listMySkills>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMySkills>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMySkills>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMySkillsQueryResult = NonNullable<Awaited<ReturnType<typeof listMySkills>>>;
export type ListMySkillsQueryError = ErrorType<unknown>;
/**
 * @summary List skills for the current freelancer
 */
export declare function useListMySkills<TData = Awaited<ReturnType<typeof listMySkills>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMySkills>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAddSkillUrl: () => string;
/**
 * @summary Add a skill to the current freelancer profile
 */
export declare const addSkill: (skillInput: SkillInput, options?: RequestInit) => Promise<FreelancerSkill>;
export declare const getAddSkillMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addSkill>>, TError, {
        data: BodyType<SkillInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addSkill>>, TError, {
    data: BodyType<SkillInput>;
}, TContext>;
export type AddSkillMutationResult = NonNullable<Awaited<ReturnType<typeof addSkill>>>;
export type AddSkillMutationBody = BodyType<SkillInput>;
export type AddSkillMutationError = ErrorType<unknown>;
/**
* @summary Add a skill to the current freelancer profile
*/
export declare const useAddSkill: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addSkill>>, TError, {
        data: BodyType<SkillInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addSkill>>, TError, {
    data: BodyType<SkillInput>;
}, TContext>;
export declare const getRemoveSkillUrl: (skillId: number) => string;
/**
 * @summary Remove a skill from the current freelancer profile
 */
export declare const removeSkill: (skillId: number, options?: RequestInit) => Promise<MessageResponse>;
export declare const getRemoveSkillMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof removeSkill>>, TError, {
        skillId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof removeSkill>>, TError, {
    skillId: number;
}, TContext>;
export type RemoveSkillMutationResult = NonNullable<Awaited<ReturnType<typeof removeSkill>>>;
export type RemoveSkillMutationError = ErrorType<unknown>;
/**
* @summary Remove a skill from the current freelancer profile
*/
export declare const useRemoveSkill: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof removeSkill>>, TError, {
        skillId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof removeSkill>>, TError, {
    skillId: number;
}, TContext>;
export declare const getListMyPortfolioUrl: () => string;
/**
 * @summary List portfolio items for the current freelancer
 */
export declare const listMyPortfolio: (options?: RequestInit) => Promise<PortfolioItem[]>;
export declare const getListMyPortfolioQueryKey: () => readonly ["/api/freelancers/me/portfolio"];
export declare const getListMyPortfolioQueryOptions: <TData = Awaited<ReturnType<typeof listMyPortfolio>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyPortfolio>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMyPortfolio>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMyPortfolioQueryResult = NonNullable<Awaited<ReturnType<typeof listMyPortfolio>>>;
export type ListMyPortfolioQueryError = ErrorType<unknown>;
/**
 * @summary List portfolio items for the current freelancer
 */
export declare function useListMyPortfolio<TData = Awaited<ReturnType<typeof listMyPortfolio>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyPortfolio>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAddPortfolioItemUrl: () => string;
/**
 * @summary Add a portfolio item
 */
export declare const addPortfolioItem: (portfolioItemInput: PortfolioItemInput, options?: RequestInit) => Promise<PortfolioItem>;
export declare const getAddPortfolioItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addPortfolioItem>>, TError, {
        data: BodyType<PortfolioItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof addPortfolioItem>>, TError, {
    data: BodyType<PortfolioItemInput>;
}, TContext>;
export type AddPortfolioItemMutationResult = NonNullable<Awaited<ReturnType<typeof addPortfolioItem>>>;
export type AddPortfolioItemMutationBody = BodyType<PortfolioItemInput>;
export type AddPortfolioItemMutationError = ErrorType<unknown>;
/**
* @summary Add a portfolio item
*/
export declare const useAddPortfolioItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof addPortfolioItem>>, TError, {
        data: BodyType<PortfolioItemInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof addPortfolioItem>>, TError, {
    data: BodyType<PortfolioItemInput>;
}, TContext>;
export declare const getDeletePortfolioItemUrl: (itemId: number) => string;
/**
 * @summary Delete a portfolio item
 */
export declare const deletePortfolioItem: (itemId: number, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeletePortfolioItemMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePortfolioItem>>, TError, {
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePortfolioItem>>, TError, {
    itemId: number;
}, TContext>;
export type DeletePortfolioItemMutationResult = NonNullable<Awaited<ReturnType<typeof deletePortfolioItem>>>;
export type DeletePortfolioItemMutationError = ErrorType<unknown>;
/**
* @summary Delete a portfolio item
*/
export declare const useDeletePortfolioItem: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePortfolioItem>>, TError, {
        itemId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePortfolioItem>>, TError, {
    itemId: number;
}, TContext>;
export declare const getGetFreelancerPortfolioUrl: (id: number) => string;
/**
 * @summary Get a freelancer's portfolio
 */
export declare const getFreelancerPortfolio: (id: number, options?: RequestInit) => Promise<PortfolioItem[]>;
export declare const getGetFreelancerPortfolioQueryKey: (id: number) => readonly [`/api/freelancers/${number}/portfolio`];
export declare const getGetFreelancerPortfolioQueryOptions: <TData = Awaited<ReturnType<typeof getFreelancerPortfolio>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFreelancerPortfolio>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFreelancerPortfolio>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFreelancerPortfolioQueryResult = NonNullable<Awaited<ReturnType<typeof getFreelancerPortfolio>>>;
export type GetFreelancerPortfolioQueryError = ErrorType<unknown>;
/**
 * @summary Get a freelancer's portfolio
 */
export declare function useGetFreelancerPortfolio<TData = Awaited<ReturnType<typeof getFreelancerPortfolio>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFreelancerPortfolio>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListProjectsUrl: (params?: ListProjectsParams) => string;
/**
 * @summary List projects in the marketplace
 */
export declare const listProjects: (params?: ListProjectsParams, options?: RequestInit) => Promise<Project[]>;
export declare const getListProjectsQueryKey: (params?: ListProjectsParams) => readonly ["/api/projects", ...ListProjectsParams[]];
export declare const getListProjectsQueryOptions: <TData = Awaited<ReturnType<typeof listProjects>>, TError = ErrorType<unknown>>(params?: ListProjectsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProjects>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProjects>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProjectsQueryResult = NonNullable<Awaited<ReturnType<typeof listProjects>>>;
export type ListProjectsQueryError = ErrorType<unknown>;
/**
 * @summary List projects in the marketplace
 */
export declare function useListProjects<TData = Awaited<ReturnType<typeof listProjects>>, TError = ErrorType<unknown>>(params?: ListProjectsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProjects>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateProjectUrl: () => string;
/**
 * @summary Post a new project
 */
export declare const createProject: (projectInput: ProjectInput, options?: RequestInit) => Promise<Project>;
export declare const getCreateProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProject>>, TError, {
        data: BodyType<ProjectInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createProject>>, TError, {
    data: BodyType<ProjectInput>;
}, TContext>;
export type CreateProjectMutationResult = NonNullable<Awaited<ReturnType<typeof createProject>>>;
export type CreateProjectMutationBody = BodyType<ProjectInput>;
export type CreateProjectMutationError = ErrorType<unknown>;
/**
* @summary Post a new project
*/
export declare const useCreateProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createProject>>, TError, {
        data: BodyType<ProjectInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createProject>>, TError, {
    data: BodyType<ProjectInput>;
}, TContext>;
export declare const getGetProjectUrl: (id: number) => string;
/**
 * @summary Get a project by ID
 */
export declare const getProject: (id: number, options?: RequestInit) => Promise<Project>;
export declare const getGetProjectQueryKey: (id: number) => readonly [`/api/projects/${number}`];
export declare const getGetProjectQueryOptions: <TData = Awaited<ReturnType<typeof getProject>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getProject>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetProjectQueryResult = NonNullable<Awaited<ReturnType<typeof getProject>>>;
export type GetProjectQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get a project by ID
 */
export declare function useGetProject<TData = Awaited<ReturnType<typeof getProject>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getProject>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateProjectUrl: (id: number) => string;
/**
 * @summary Update a project
 */
export declare const updateProject: (id: number, projectUpdate: ProjectUpdate, options?: RequestInit) => Promise<Project>;
export declare const getUpdateProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProject>>, TError, {
        id: number;
        data: BodyType<ProjectUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateProject>>, TError, {
    id: number;
    data: BodyType<ProjectUpdate>;
}, TContext>;
export type UpdateProjectMutationResult = NonNullable<Awaited<ReturnType<typeof updateProject>>>;
export type UpdateProjectMutationBody = BodyType<ProjectUpdate>;
export type UpdateProjectMutationError = ErrorType<unknown>;
/**
* @summary Update a project
*/
export declare const useUpdateProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateProject>>, TError, {
        id: number;
        data: BodyType<ProjectUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateProject>>, TError, {
    id: number;
    data: BodyType<ProjectUpdate>;
}, TContext>;
export declare const getDeleteProjectUrl: (id: number) => string;
/**
 * @summary Delete a project
 */
export declare const deleteProject: (id: number, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteProjectMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProject>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteProject>>, TError, {
    id: number;
}, TContext>;
export type DeleteProjectMutationResult = NonNullable<Awaited<ReturnType<typeof deleteProject>>>;
export type DeleteProjectMutationError = ErrorType<unknown>;
/**
* @summary Delete a project
*/
export declare const useDeleteProject: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteProject>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteProject>>, TError, {
    id: number;
}, TContext>;
export declare const getListMyProjectsUrl: () => string;
/**
 * @summary List projects posted by the current client
 */
export declare const listMyProjects: (options?: RequestInit) => Promise<Project[]>;
export declare const getListMyProjectsQueryKey: () => readonly ["/api/projects/my"];
export declare const getListMyProjectsQueryOptions: <TData = Awaited<ReturnType<typeof listMyProjects>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyProjects>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMyProjects>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMyProjectsQueryResult = NonNullable<Awaited<ReturnType<typeof listMyProjects>>>;
export type ListMyProjectsQueryError = ErrorType<unknown>;
/**
 * @summary List projects posted by the current client
 */
export declare function useListMyProjects<TData = Awaited<ReturnType<typeof listMyProjects>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyProjects>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getApplyToProjectUrl: () => string;
/**
 * @summary Apply to a project
 */
export declare const applyToProject: (applicationInput: ApplicationInput, options?: RequestInit) => Promise<Application>;
export declare const getApplyToProjectMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyToProject>>, TError, {
        data: BodyType<ApplicationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof applyToProject>>, TError, {
    data: BodyType<ApplicationInput>;
}, TContext>;
export type ApplyToProjectMutationResult = NonNullable<Awaited<ReturnType<typeof applyToProject>>>;
export type ApplyToProjectMutationBody = BodyType<ApplicationInput>;
export type ApplyToProjectMutationError = ErrorType<ErrorResponse>;
/**
* @summary Apply to a project
*/
export declare const useApplyToProject: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof applyToProject>>, TError, {
        data: BodyType<ApplicationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof applyToProject>>, TError, {
    data: BodyType<ApplicationInput>;
}, TContext>;
export declare const getListMyApplicationsUrl: () => string;
/**
 * @summary List applications submitted by the current freelancer
 */
export declare const listMyApplications: (options?: RequestInit) => Promise<Application[]>;
export declare const getListMyApplicationsQueryKey: () => readonly ["/api/applications/my"];
export declare const getListMyApplicationsQueryOptions: <TData = Awaited<ReturnType<typeof listMyApplications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMyApplications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMyApplicationsQueryResult = NonNullable<Awaited<ReturnType<typeof listMyApplications>>>;
export type ListMyApplicationsQueryError = ErrorType<unknown>;
/**
 * @summary List applications submitted by the current freelancer
 */
export declare function useListMyApplications<TData = Awaited<ReturnType<typeof listMyApplications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMyApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListProjectApplicationsUrl: (projectId: number) => string;
/**
 * @summary List applications for a specific project (client only)
 */
export declare const listProjectApplications: (projectId: number, options?: RequestInit) => Promise<Application[]>;
export declare const getListProjectApplicationsQueryKey: (projectId: number) => readonly [`/api/projects/${number}/applications`];
export declare const getListProjectApplicationsQueryOptions: <TData = Awaited<ReturnType<typeof listProjectApplications>>, TError = ErrorType<unknown>>(projectId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProjectApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listProjectApplications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListProjectApplicationsQueryResult = NonNullable<Awaited<ReturnType<typeof listProjectApplications>>>;
export type ListProjectApplicationsQueryError = ErrorType<unknown>;
/**
 * @summary List applications for a specific project (client only)
 */
export declare function useListProjectApplications<TData = Awaited<ReturnType<typeof listProjectApplications>>, TError = ErrorType<unknown>>(projectId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listProjectApplications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateApplicationStatusUrl: (id: number) => string;
/**
 * @summary Accept or reject an application (client only)
 */
export declare const updateApplicationStatus: (id: number, applicationStatusUpdate: ApplicationStatusUpdate, options?: RequestInit) => Promise<Application>;
export declare const getUpdateApplicationStatusMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateApplicationStatus>>, TError, {
        id: number;
        data: BodyType<ApplicationStatusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateApplicationStatus>>, TError, {
    id: number;
    data: BodyType<ApplicationStatusUpdate>;
}, TContext>;
export type UpdateApplicationStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateApplicationStatus>>>;
export type UpdateApplicationStatusMutationBody = BodyType<ApplicationStatusUpdate>;
export type UpdateApplicationStatusMutationError = ErrorType<unknown>;
/**
* @summary Accept or reject an application (client only)
*/
export declare const useUpdateApplicationStatus: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateApplicationStatus>>, TError, {
        id: number;
        data: BodyType<ApplicationStatusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateApplicationStatus>>, TError, {
    id: number;
    data: BodyType<ApplicationStatusUpdate>;
}, TContext>;
export declare const getGetFreelancerDashboardUrl: () => string;
/**
 * @summary Get freelancer dashboard summary
 */
export declare const getFreelancerDashboard: (options?: RequestInit) => Promise<FreelancerDashboard>;
export declare const getGetFreelancerDashboardQueryKey: () => readonly ["/api/dashboard/freelancer"];
export declare const getGetFreelancerDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getFreelancerDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFreelancerDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getFreelancerDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetFreelancerDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getFreelancerDashboard>>>;
export type GetFreelancerDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Get freelancer dashboard summary
 */
export declare function useGetFreelancerDashboard<TData = Awaited<ReturnType<typeof getFreelancerDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getFreelancerDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetClientDashboardUrl: () => string;
/**
 * @summary Get client dashboard summary
 */
export declare const getClientDashboard: (options?: RequestInit) => Promise<ClientDashboard>;
export declare const getGetClientDashboardQueryKey: () => readonly ["/api/dashboard/client"];
export declare const getGetClientDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getClientDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getClientDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getClientDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetClientDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getClientDashboard>>>;
export type GetClientDashboardQueryError = ErrorType<unknown>;
/**
 * @summary Get client dashboard summary
 */
export declare function useGetClientDashboard<TData = Awaited<ReturnType<typeof getClientDashboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getClientDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAiFreelancerRecommendationsUrl: () => string;
/**
 * @summary Get AI-matched freelancer recommendations for client's open projects
 */
export declare const getAiFreelancerRecommendations: (options?: RequestInit) => Promise<ProjectFreelancerRecommendations[]>;
export declare const getGetAiFreelancerRecommendationsQueryKey: () => readonly ["/api/dashboard/ai-freelancers"];
export declare const getGetAiFreelancerRecommendationsQueryOptions: <TData = Awaited<ReturnType<typeof getAiFreelancerRecommendations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAiFreelancerRecommendations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAiFreelancerRecommendations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAiFreelancerRecommendationsQueryResult = NonNullable<Awaited<ReturnType<typeof getAiFreelancerRecommendations>>>;
export type GetAiFreelancerRecommendationsQueryError = ErrorType<unknown>;
/**
 * @summary Get AI-matched freelancer recommendations for client's open projects
 */
export declare function useGetAiFreelancerRecommendations<TData = Awaited<ReturnType<typeof getAiFreelancerRecommendations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAiFreelancerRecommendations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAiRecommendationsUrl: () => string;
/**
 * @summary Get AI-matched project recommendations for current freelancer
 */
export declare const getAiRecommendations: (options?: RequestInit) => Promise<AiRecommendation[]>;
export declare const getGetAiRecommendationsQueryKey: () => readonly ["/api/dashboard/ai-recommendations"];
export declare const getGetAiRecommendationsQueryOptions: <TData = Awaited<ReturnType<typeof getAiRecommendations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAiRecommendations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAiRecommendations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAiRecommendationsQueryResult = NonNullable<Awaited<ReturnType<typeof getAiRecommendations>>>;
export type GetAiRecommendationsQueryError = ErrorType<unknown>;
/**
 * @summary Get AI-matched project recommendations for current freelancer
 */
export declare function useGetAiRecommendations<TData = Awaited<ReturnType<typeof getAiRecommendations>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAiRecommendations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map