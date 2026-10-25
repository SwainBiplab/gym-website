import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { updateSettingsAction } from "@/actions/settings";
import { PageHeader, Card, CardHeader } from "@/components/ui/card";
import { Input, Textarea, Checkbox } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";
import { BrandMark } from "@/components/brand/brand-mark";
import { AccentPicker } from "./accent-picker";
import { MediaField } from "./media-field";

export default async function SettingsPage() {
  await requireUser(["SUPERADMIN"]);
  const s = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Super admin" title="Branding & settings" description="Rename the gym, upload a logo, pick the accent colour and edit the homepage copy and contact details. Changes apply everywhere immediately." />
      <ActionForm action={updateSettingsAction} className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Identity" />
            <FormAlert className="mb-4" />
            <div className="grid gap-4 md:grid-cols-2">
              <AField name="name" label="Gym name"><Input name="name" defaultValue={s.name} required /></AField>
              <AField name="tagline" label="Tagline"><Input name="tagline" defaultValue={s.tagline ?? ""} placeholder="Strength. Community. Progress." /></AField>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr] md:items-start">
              <div className="glass glass-sm grid h-24 w-24 place-items-center overflow-hidden">
                {s.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logoDataUrl} alt="Current logo" className="h-20 w-20 object-contain" />
                ) : (
                  <BrandMark size={56} />
                )}
              </div>
              <div className="space-y-2">
                <AField name="logo" label="Logo" hint="PNG, JPG, WebP or SVG up to 400 KB. Square works best.">
                  <Input name="logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="h-auto py-2 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[var(--on-accent)]" />
                </AField>
                {s.logoDataUrl && <Checkbox name="removeLogo" label="Remove current logo and use the default mark" />}
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Homepage videos" description="Replace the 3D scenes with your own footage. Leave empty to keep the 3D scene." />
            <div className="space-y-6">
              <MediaField name="heroVideo" label="Hero video" initial={s.heroVideo ?? ""} hint="Landscape, 8–20 s loop, no audio needed. The floating panels stay on top." />
              <MediaField name="showcaseVideo" label="Showcase video" initial={s.showcaseVideo ?? ""} hint="Shown beside “Serious kit, coached properly”. Wide or square works well." />
            </div>
          </Card>
          <Card>
            <CardHeader title="Homepage copy" description="Shown in the hero section of the public site." />
            <AField name="heroTitle" label="Headline"><Input name="heroTitle" defaultValue={s.heroTitle} required /></AField>
            <AField name="heroSubtitle" label="Sub-headline" className="mt-4"><Textarea name="heroSubtitle" className="min-h-20" defaultValue={s.heroSubtitle} required /></AField>
          </Card>
          <Card>
            <CardHeader title="Contact details" description="Used in the footer, contact page and emails." />
            <div className="grid gap-4 md:grid-cols-2">
              <AField name="address" label="Address" className="md:col-span-2"><Input name="address" defaultValue={s.address ?? ""} /></AField>
              <AField name="phone" label="Phone"><Input name="phone" defaultValue={s.phone ?? ""} /></AField>
              <AField name="email" label="Email"><Input name="email" type="email" defaultValue={s.email ?? ""} /></AField>
              <AField name="hours" label="Opening hours"><Input name="hours" defaultValue={s.hours ?? ""} /></AField>
              <AField name="instagram" label="Instagram handle"><Input name="instagram" defaultValue={s.instagram ?? ""} /></AField>
              <AField name="facebook" label="Facebook page URL" className="md:col-span-2"><Input name="facebook" defaultValue={s.facebook ?? ""} /></AField>
            </div>
          </Card>
        </div>
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card strong>
            <CardHeader title="Accent colour" description="One brand colour drives buttons, charts, rings and the 3D scene lighting." />
            <AccentPicker initial={s.accentColor} />
          </Card>
          <Card>
            <CardHeader title="Save" />
            <p className="mb-4 text-sm text-fg-muted">Branding changes are audited and take effect on the next page load for everyone.</p>
            <SubmitButton className="w-full" pendingText="Saving…">Save branding</SubmitButton>
          </Card>
        </div>
      </ActionForm>
    </>
  );
}
