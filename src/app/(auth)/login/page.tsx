import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; verified?: string; reset?: string; expired?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect(sp.next && sp.next.startsWith("/") ? sp.next : "/dashboard");
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-fg-muted">Sign in to book classes and manage your membership.</p>
      {sp.expired === "1" && <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">Your session expired or the account was reset. Please sign in again.</p>}
      {sp.verified === "0" && <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">That verification link is invalid or expired.</p>}
      <ActionForm action={loginAction} className="mt-6">
        <FormAlert />
        {sp.next && <input type="hidden" name="next" value={sp.next} />}
        <AField name="email" label="Email">
          <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </AField>
        <AField name="password" label="Password">
          <Input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
        </AField>
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="link link-muted">Forgot password?</Link>
        </div>
        <SubmitButton className="w-full" pendingText="Signing in…">Sign in</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-fg-muted">
        New here?{" "}
        <Link href="/register" className="link">Create an account</Link>
      </p>
      <div className="mt-6 rounded-2xl border border-white/8 bg-white/4 p-3 text-xs text-fg-subtle">
        Demo accounts (password <code>Password123</code>): admin@gym.test · maya@gym.test (trainer) · member@gym.test
      </div>
    </>
  );
}
