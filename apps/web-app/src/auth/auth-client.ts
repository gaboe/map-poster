import { env } from "@/env/client";
import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  organizationClient,
} from "better-auth/client/plugins";

const betterAuthBaseUrl = env.VITE_BETTER_AUTH_URL.endsWith(
  "/api/auth"
)
  ? env.VITE_BETTER_AUTH_URL
  : new URL(
      "/api/auth",
      env.VITE_BETTER_AUTH_URL
    ).toString();

export const authClient = createAuthClient({
  betterAuthBaseUrl,
  plugins: [adminClient(), organizationClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

type AuthCallback = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

const withAuthRedirect = async <T>(
  authFn: (callbacks: AuthCallback) => Promise<T>,
  callbackURL: string
): Promise<T> => {
  return authFn({
    onSuccess: () => {
      window.location.href = callbackURL;
    },
  });
};

export const signInWithEmail = async (
  email: string,
  password: string,
  callbackURL = "/app/dashboard"
) => {
  return withAuthRedirect(
    (callbacks) =>
      signIn.email({ email, password }, callbacks),
    callbackURL
  );
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  callbackURL = "/app/dashboard"
) => {
  return withAuthRedirect(
    (callbacks) =>
      signUp.email({ email, password, name }, callbacks),
    callbackURL
  );
};

export const signInWithGithub = async (
  callbackURL = "/app/dashboard"
) => {
  return signIn.social({
    provider: "github",
    callbackURL,
  });
};

export const signInWithGoogle = async (
  callbackURL = "/app/dashboard"
) => {
  return signIn.social({
    provider: "google",
    callbackURL,
  });
};
