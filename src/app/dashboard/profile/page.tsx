import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { updateProfileAction, changePasswordAction } from "@/actions/profile";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader eyebrow="Account" title="Your profile" description={`Member code ${user.memberCode} · joined ${format(user.createdAt, "MMM yyyy")}`} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Personal details" />
          <ActionForm action={updateProfileAction}>
            <FormAlert />
            <AField name="name" label="Full name"><Input name="name" defaultValue={user.name} required /></AField>
            <div className="grid gap-4 md:grid-cols-2">
              <AField name="email" label="Email"><Input value={user.email} disabled /></AField>
              <AField name="phone" label="Phone"><Input name="phone" defaultValue={user.phone ?? ""} /></AField>
              <AField name="dateOfBirth" label="Date of birth"><Input name="dateOfBirth" type="date" defaultValue={user.dateOfBirth ? format(user.dateOfBirth, "yyyy-MM-dd") : ""} /></AField>
              <AField name="gender" label="Gender">
                <Select name="gender" defaultValue={user.gender ?? ""}>
                  <option value="">Prefer not to say</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Non-binary</option>
                </Select>
              </AField>
            </div>
            <AField name="address" label="Address"><Input name="address" defaultValue={user.address ?? ""} /></AField>
            <AField name="emergencyContact" label="Emergency contact" hint="Name and phone number"><Input name="emergencyContact" defaultValue={user.emergencyContact ?? ""} /></AField>
            <SubmitButton pendingText="Saving…">Save changes</SubmitButton>
          </ActionForm>
        </Card>
        <Card>
          <CardHeader title="Change password" />
          <ActionForm action={changePasswordAction} resetOnSuccess>
            <FormAlert />
            <AField name="current" label="Current password"><Input name="current" type="password" autoComplete="current-password" required /></AField>
            <AField name="password" label="New password"><Input name="password" type="password" autoComplete="new-password" required minLength={8} /></AField>
            <AField name="confirm" label="Confirm new password"><Input name="confirm" type="password" autoComplete="new-password" required minLength={8} /></AField>
            <SubmitButton variant="glass" pendingText="Updating…">Update password</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
