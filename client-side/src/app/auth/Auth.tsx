"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, KeyRound, Leaf, MailCheck } from "lucide-react";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { FaYandex } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { getOAuthUrl } from "@/constants/api.constants";
import { authService } from "@/services/auth.service";
import type { IAuthForm } from "@/shared/types/auth.interface";
import { extractErrorMessage } from "@/utils/errors";

type AuthType = "login" | "register";
type View = "form" | "verify-email" | "forgot-password" | "reset-password";

const EMPTY_FORM: IAuthForm = { name: "", email: "", password: "" };
// Держим в шаге с RESEND_COOLDOWN_SECONDS на бэкенде (auth.service.ts) —
// это только для UI-таймера, реальный лимит проверяется на сервере.
const RESEND_COOLDOWN_SECONDS = 60;

export function Auth() {
  const router = useRouter();
  const [type, setType] = useState<AuthType>("login");
  const [form, setForm] = useState<IAuthForm>(EMPTY_FORM);
  const [view, setView] = useState<View>("form");
  // Email, к которому относится текущий код (подтверждение почты или сброс
  // пароля) — используется и в verify-email, и в forgot/reset-password.
  const [pendingEmail, setPendingEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const isRegister = type === "register";

  const isCoolingDown = resendCooldown > 0;
  useEffect(() => {
    if (!isCoolingDown) return;
    const id = setInterval(() => {
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isCoolingDown]);

  const loginMutation = useMutation({
    mutationFn: () =>
      authService.login({ email: form.email, password: form.password }),
    onSuccess() {
      toast.success("С возвращением!");
      setForm(EMPTY_FORM);
      router.push("/dashboard");
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => authService.register(form),
    onSuccess(response) {
      toast.success("Код подтверждения отправлен на почту");
      setPendingEmail(response.data.email);
      setCode("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setView("verify-email");
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => authService.verifyEmail(pendingEmail, code),
    onSuccess() {
      toast.success("Аккаунт подтверждён!");
      resetAll();
      router.push("/dashboard");
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authService.resendCode(pendingEmail),
    onSuccess() {
      toast.success("Код отправлен повторно");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: () => authService.forgotPassword(form.email),
    onSuccess(response) {
      toast.success("Если такой email зарегистрирован — мы отправили код");
      setPendingEmail(response.data.email);
      setCode("");
      setNewPassword("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setView("reset-password");
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () =>
      authService.resetPassword(pendingEmail, code, newPassword),
    onSuccess() {
      toast.success("Пароль обновлён!");
      resetAll();
      router.push("/dashboard");
    },
    onError(error) {
      toast.error(extractErrorMessage(error));
    },
  });

  function resetAll() {
    setForm(EMPTY_FORM);
    setPendingEmail("");
    setCode("");
    setNewPassword("");
    setResendCooldown(0);
    setView("form");
  }

  function switchType(next: AuthType) {
    if (next === type) return;
    setType(next);
  }

  function updateField(field: keyof IAuthForm) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isRegister) {
      registerMutation.mutate();
    } else {
      loginMutation.mutate();
    }
  }

  if (view === "verify-email") {
    return (
      <CodeScreen
        icon={<MailCheck className="size-6" />}
        title="Подтвердите почту"
        description={
          <>
            Мы отправили 6-значный код на{" "}
            <span className="text-foreground font-medium">
              {pendingEmail}
            </span>
          </>
        }
        code={code}
        onCodeChange={setCode}
        onBack={() => setView("form")}
        onSubmit={() => verifyMutation.mutate()}
        isPending={verifyMutation.isPending}
        submitLabel="Подтвердить"
        pendingLabel="Проверяем…"
        footer={
          <>
            Не пришёл код?{" "}
            <button
              type="button"
              disabled={resendMutation.isPending || resendCooldown > 0}
              onClick={() => resendMutation.mutate()}
              className="text-primary font-medium hover:underline disabled:no-underline disabled:opacity-50"
            >
              {resendMutation.isPending
                ? "Отправляем…"
                : resendCooldown > 0
                  ? `Отправить ещё раз (${resendCooldown}с)`
                  : "Отправить ещё раз"}
            </button>
          </>
        }
      />
    );
  }

  if (view === "forgot-password") {
    return (
      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-emerald-100 p-4 dark:from-emerald-950/40 dark:via-background dark:to-emerald-900/30">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-xl shadow-emerald-900/5 backdrop-blur">
          <button
            type="button"
            onClick={() => setView("form")}
            className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
          >
            <ArrowLeft className="size-4" />
            Назад
          </button>

          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <KeyRound className="size-6" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">
              Восстановление пароля
            </h1>
            <p className="text-muted-foreground text-sm">
              Пришлём код для сброса пароля на почту
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              forgotPasswordMutation.mutate();
            }}
            className="flex flex-col gap-4"
          >
            <Field label="Email">
              <input
                type="email"
                required
                value={form.email}
                onChange={updateField("email")}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass}
              />
            </Field>

            <Button
              type="submit"
              size="lg"
              disabled={forgotPasswordMutation.isPending}
              className="mt-2 h-11 w-full text-base"
            >
              {forgotPasswordMutation.isPending
                ? "Отправляем…"
                : "Отправить код"}
            </Button>
          </form>
        </div>
      </main>
    );
  }

  if (view === "reset-password") {
    return (
      <CodeScreen
        icon={<KeyRound className="size-6" />}
        title="Новый пароль"
        description={
          <>
            Введите код из письма на{" "}
            <span className="text-foreground font-medium">
              {pendingEmail}
            </span>{" "}
            и придумайте новый пароль
          </>
        }
        code={code}
        onCodeChange={setCode}
        onBack={() => setView("forgot-password")}
        onSubmit={() => resetPasswordMutation.mutate()}
        isPending={resetPasswordMutation.isPending}
        submitLabel="Сохранить пароль"
        pendingLabel="Сохраняем…"
        submitDisabled={newPassword.length < 6}
        extraField={
          <Field label="Новый пароль">
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete="new-password"
              className={inputClass}
            />
          </Field>
        }
        footer={
          <>
            Не пришёл код?{" "}
            <button
              type="button"
              disabled={forgotPasswordMutation.isPending || resendCooldown > 0}
              onClick={() => forgotPasswordMutation.mutate()}
              className="text-primary font-medium hover:underline disabled:no-underline disabled:opacity-50"
            >
              {forgotPasswordMutation.isPending
                ? "Отправляем…"
                : resendCooldown > 0
                  ? `Отправить ещё раз (${resendCooldown}с)`
                  : "Отправить ещё раз"}
            </button>
          </>
        }
      />
    );
  }

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-emerald-100 p-4 dark:from-emerald-950/40 dark:via-background dark:to-emerald-900/30">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-xl shadow-emerald-900/5 backdrop-blur">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Leaf className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Green<span className="text-primary">Art</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {isRegister
              ? "Создайте аккаунт, чтобы начать покупки"
              : "Войдите в свой аккаунт"}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(["login", "register"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => switchType(tab)}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                type === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <Field label="Имя">
              <input
                type="text"
                value={form.name}
                onChange={updateField("name")}
                placeholder="Как к вам обращаться"
                autoComplete="name"
                className={inputClass}
              />
            </Field>
          )}

          <Field label="Email">
            <input
              type="email"
              required
              value={form.email}
              onChange={updateField("email")}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
          </Field>

          <Field
            label="Пароль"
            action={
              !isRegister && (
                <button
                  type="button"
                  onClick={() => setView("forgot-password")}
                  className="text-primary text-xs font-medium hover:underline"
                >
                  Забыли пароль?
                </button>
              )
            }
          >
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={updateField("password")}
              placeholder="Минимум 6 символов"
              autoComplete={isRegister ? "new-password" : "current-password"}
              className={inputClass}
            />
          </Field>

          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="mt-2 h-11 w-full text-base"
          >
            {isPending
              ? "Подождите…"
              : isRegister
                ? "Создать аккаунт"
                : "Войти"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-muted-foreground text-xs uppercase">
            или
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-3">
          <Button asChild variant="outline" size="lg" className="h-11 w-full">
            <a href={getOAuthUrl("google")}>
              <FcGoogle className="size-5" />
              Продолжить с Google
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11 w-full">
            <a href={getOAuthUrl("yandex")}>
              <FaYandex className="size-5 text-[#FC3F1D]" />
              Продолжить с Yandex
            </a>
          </Button>
        </div>

        <p className="text-muted-foreground mt-6 text-center text-sm">
          {isRegister ? "Уже есть аккаунт? " : "Нет аккаунта? "}
          <button
            type="button"
            onClick={() => switchType(isRegister ? "login" : "register")}
            className="font-medium text-primary hover:underline"
          >
            {isRegister ? "Войти" : "Зарегистрироваться"}
          </button>
        </p>
      </div>
    </main>
  );
}

/** Общий каркас для экранов "введите 6-значный код" (verify-email, reset-password). */
function CodeScreen({
  icon,
  title,
  description,
  code,
  onCodeChange,
  onBack,
  onSubmit,
  isPending,
  submitLabel,
  pendingLabel,
  submitDisabled,
  extraField,
  footer,
}: {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  code: string;
  onCodeChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  submitDisabled?: boolean;
  extraField?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-emerald-100 p-4 dark:from-emerald-950/40 dark:via-background dark:to-emerald-900/30">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-xl shadow-emerald-900/5 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="size-4" />
          Назад
        </button>

        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            {icon}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <Field label="Код из письма">
            <input
              type="text"
              inputMode="numeric"
              required
              maxLength={6}
              value={code}
              onChange={(e) =>
                onCodeChange(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              autoComplete="one-time-code"
              className={`${inputClass} text-center text-xl tracking-[0.5em]`}
            />
          </Field>

          {extraField}

          <Button
            type="submit"
            size="lg"
            disabled={isPending || code.length !== 6 || submitDisabled}
            className="mt-2 h-11 w-full text-base"
          >
            {isPending ? pendingLabel : submitLabel}
          </Button>
        </form>

        {footer && (
          <p className="text-muted-foreground mt-6 text-center text-sm">
            {footer}
          </p>
        )}
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

function Field({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between">
        <span className="text-foreground text-sm font-medium">{label}</span>
        {action}
      </span>
      {children}
    </label>
  );
}
