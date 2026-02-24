
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const signIn = authClient.signIn;

export const signUp = authClient.signUp;

export const signOut = authClient.signOut;

export const requestPasswordReset = authClient.requestPasswordReset;

export const resetPassword = authClient.resetPassword;

export const sendVerificationEmail = authClient.sendVerificationEmail;

export const updateUser = authClient.updateUser;

export const changePassword = authClient.changePassword;

export const deleteUser = authClient.deleteUser;

export const listSessions = authClient.listSessions;


export const revokeSession = authClient.revokeSession;

export const revokeOtherSessions = authClient.revokeOtherSessions;



export const useSession = authClient.useSession;
