import { axiosClassic } from "@/api/axios";
import { getAuthUrl } from "@/constants/api.constants";
import type { IAuthForm, IAuthResponse } from "@/shared/types/auth.interface";

import { removeFromStorage, saveTokenStorage } from "./auth-token.service";

export const authService = {
  async login(data: Pick<IAuthForm, "email" | "password">) {
    const response = await axiosClassic.post<IAuthResponse>(
      getAuthUrl("/login"),
      data,
    );

    if (response.data.accessToken) {
      saveTokenStorage(response.data.accessToken);
    }

    return response;
  },

  /** Первый шаг регистрации — только отправляет код на почту, токенов нет. */
  async register(data: IAuthForm) {
    const response = await axiosClassic.post<{ email: string }>(
      getAuthUrl("/register"),
      data,
    );

    return response;
  },

  /** Второй шаг — подтверждение кода из письма завершает регистрацию и логинит. */
  async verifyEmail(email: string, code: string) {
    const response = await axiosClassic.post<IAuthResponse>(
      getAuthUrl("/verify-email"),
      { email, code },
    );

    if (response.data.accessToken) {
      saveTokenStorage(response.data.accessToken);
    }

    return response;
  },

  async resendCode(email: string) {
    const response = await axiosClassic.post<{ email: string }>(
      getAuthUrl("/resend-code"),
      { email },
    );

    return response;
  },

  /** Всегда отвечает успехом, даже если email не зарегистрирован — так и задумано. */
  async forgotPassword(email: string) {
    const response = await axiosClassic.post<{ email: string }>(
      getAuthUrl("/forgot-password"),
      { email },
    );

    return response;
  },

  async resetPassword(email: string, code: string, newPassword: string) {
    const response = await axiosClassic.post<IAuthResponse>(
      getAuthUrl("/reset-password"),
      { email, code, newPassword },
    );

    if (response.data.accessToken) {
      saveTokenStorage(response.data.accessToken);
    }

    return response;
  },

  async getNewTokens() {
    const response = await axiosClassic.post<IAuthResponse>(
      getAuthUrl("/login/access-token"),
    );

    if (response.data.accessToken) {
      saveTokenStorage(response.data.accessToken);
    }

    return response;
  },

  /** Обменивает одноразовый код OAuth-возврата на access-токен. */
  async exchangeOAuthCode(code: string) {
    const response = await axiosClassic.post<{ accessToken: string }>(
      getAuthUrl("/oauth/exchange"),
      { code },
    );

    if (response.data.accessToken) {
      saveTokenStorage(response.data.accessToken);
    }

    return response;
  },

  async logout() {
    const response = await axiosClassic.post<boolean>(getAuthUrl("/logout"));

    if (response.data) {
      removeFromStorage();
    }

    return response;
  },
};
