import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { contactAction } from "@/actions/contact";
import { PageHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { ActionForm, AField, FormAlert } from "@/components/forms/action-form";

export const metadata: Metadata = { title: "Contact" };

import { getSettings } from "@/lib/settings";

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Contact" title="Come say hi" description="Questions about memberships, personal training or corporate rates? Drop us a line." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {([
            [MapPin, s.address],
            [Phone, s.phone],
            [Mail, s.email],
            [Clock, s.hours],
          ] as const).filter(([, v]) => !!v).map(([Icon, text], i) => {
            const I = Icon as typeof MapPin;
            return (
              <div key={i} className="glass glass-sm flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/8">
                  <I className="h-4 w-4 text-accent-2" />
                </span>
                <span className="text-sm">{text as string}</span>
              </div>
            );
          })}
        </div>
        <div className="glass p-7">
          <ActionForm action={contactAction} resetOnSuccess>
            <FormAlert />
            <div className="grid gap-4 md:grid-cols-2">
              <AField name="name" label="Name">
                <Input name="name" required placeholder="Your name" />
              </AField>
              <AField name="email" label="Email">
                <Input name="email" type="email" required placeholder="you@example.com" />
              </AField>
            </div>
            <AField name="subject" label="Subject">
              <Input name="subject" required placeholder="Membership question" />
            </AField>
            <AField name="message" label="Message">
              <Textarea name="message" required placeholder="How can we help?" />
            </AField>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <SubmitButton pendingText="Sending…">Send message</SubmitButton>
          </ActionForm>
        </div>
      </div>
    </>
  );
}
