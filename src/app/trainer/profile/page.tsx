import { requireUser } from "@/lib/auth";
import { updateTrainerProfileAction } from "@/actions/trainer";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";

export default async function TrainerProfilePage() {
  const user = await requireUser(["TRAINER", "ADMIN"]);
  const p = user.trainerProfile;
  return (
    <>
      <PageHeader eyebrow="Coach" title="Your public profile" description="Shown on the Trainers page." />
      <Card className="max-w-2xl">
        <CardHeader title={user.name} />
        <ActionForm action={updateTrainerProfileAction}>
          <FormAlert />
          <AField name="bio" label="Bio"><Textarea name="bio" defaultValue={p?.bio ?? ""} /></AField>
          <AField name="specialties" label="Specialties" hint="Comma separated"><Input name="specialties" defaultValue={p?.specialties ?? ""} /></AField>
          <div className="grid gap-4 md:grid-cols-2">
            <AField name="yearsExperience" label="Years of experience"><Input name="yearsExperience" type="number" defaultValue={p?.yearsExperience ?? 0} /></AField>
            <AField name="instagram" label="Instagram handle"><Input name="instagram" defaultValue={p?.instagram ?? ""} /></AField>
          </div>
          <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
        </ActionForm>
      </Card>
    </>
  );
}
