import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { registerAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  if (await getCurrentUser()) redirect(plan ? `/dashboard/membership?plan=${plan}` : "/dashboard");
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-fg-muted">{plan ? `You'll pick the ${plan} plan next.` : "Takes less than a minute. Free trial included on eligible plans."}</p>
      <ActionForm action={registerAction} className="mt-6">
        <FormAlert />
        <AField name="name" label="Full name">
          <Input name="name" autoComplete="name" required placeholder="Jane Doe" />
        </AField>
        <AField name="email" label="Email">
          <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </AField>
        <AField name="phone" label="Phone (optional)">
          <Input name="phone" type="tel" autoComplete="tel" placeholder="+1 555 0100" />
        </AField>
        <AField name="password" label="Password" hint="At least 8 characters with a letter and a number.">
          <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
        </AField>
        <SubmitButton className="w-full" pendingText="Creating account…">Create account</SubmitButton>
        <p className="text-center text-xs text-fg-subtle">By joining you agree to the club rules and privacy policy.</p>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-fg-muted">
        Already a member?{" "}
        <Link href="/login" className="link">Sign in</Link>
      </p>
    </>
  );
}
