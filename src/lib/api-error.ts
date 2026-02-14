import axios, { AxiosError } from "axios";

export type ApiErrorResponse = {
  message?: string;
  [key: string]: unknown;
};

export const isAxiosApiError = (
  error: unknown,
): error is AxiosError<ApiErrorResponse> =>
  axios.isAxiosError<ApiErrorResponse>(error);

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong!",
) => {
  if (isAxiosApiError(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
};

export const getApiErrorStatus = (error: unknown) => {
  if (!isAxiosApiError(error)) return undefined;
  return error.response?.status;
};
