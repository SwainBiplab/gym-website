import Link from "next/link";
import type { Metadata } from "next";
import { resetPasswordAction } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Invalid link</h1>
        <p className="mt-2 text-sm text-fg-muted">This reset link is missing its token.</p>
        <Link href="/forgot-password" className="link mt-4">Request a new one</Link>
      </>
    );
  }
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <ActionForm action={resetPasswordAction} className="mt-6">
        <FormAlert />
        <input type="hidden" name="token" value={token} />
        <AField name="password" label="New password">
          <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
        </AField>
        <AField name="confirm" label="Confirm password">
          <Input name="confirm" type="password" autoComplete="new-password" required minLength={8} />
        </AField>
        <SubmitButton className="w-full" pendingText="Saving…">Update password</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-fg-muted">
        <Link href="/login" className="link">Back to sign in</Link>
      </p>
    </>
  );
}
