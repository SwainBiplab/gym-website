import Link from "next/link";
import type { Metadata } from "next";
import { forgotPasswordAction } from "@/actions/auth";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-fg-muted">Enter your email and we&apos;ll send a reset link.</p>
      <ActionForm action={forgotPasswordAction} className="mt-6">
        <FormAlert />
        <AField name="email" label="Email">
          <Input name="email" type="email" required placeholder="you@example.com" />
        </AField>
        <SubmitButton className="w-full" pendingText="Sending…">Send reset link</SubmitButton>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-fg-muted">
        <Link href="/login" className="link">Back to sign in</Link>
      </p>
    </>
  );
}
