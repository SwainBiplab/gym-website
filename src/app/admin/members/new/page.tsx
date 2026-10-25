import { requireUser } from "@/lib/auth";
import { createMemberAction } from "@/actions/admin";
import { PageHeader, Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";

export default async function NewMemberPage() {
  await requireUser(["ADMIN"]);
  return (
    <>
      <PageHeader eyebrow="People" title="Add a member" description="Creates an account with a temporary password. The email is marked verified." />
      <Card className="max-w-xl">
        <ActionForm action={createMemberAction}>
          <FormAlert />
          <AField name="name" label="Full name"><Input name="name" required /></AField>
          <AField name="email" label="Email"><Input name="email" type="email" required /></AField>
          <div className="grid gap-4 md:grid-cols-2">
            <AField name="phone" label="Phone"><Input name="phone" /></AField>
            <AField name="role" label="Role">
              <Select name="role" defaultValue="MEMBER">
                <option value="MEMBER">Member</option>
                <option value="TRAINER">Trainer</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </AField>
          </div>
          <AField name="password" label="Temporary password" hint="Share it with the member; they can change it later."><Input name="password" type="text" required minLength={8} defaultValue="Welcome123" /></AField>
          <SubmitButton pendingText="Creating…">Create account</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
