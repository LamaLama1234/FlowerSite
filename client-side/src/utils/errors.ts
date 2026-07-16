import type { AxiosError } from "axios";

/** Достаём человекочитаемое сообщение из ошибки бэкенда. */
export function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message?: string | string[] }>;
  const message = axiosError?.response?.data?.message;

  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  return "Что-то пошло не так. Попробуйте ещё раз.";
}
