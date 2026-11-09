'use client';

import { useEffect, useState } from 'react';
import { settingsInput } from '@riad/shared';
import { Button, Callout, Card, CardBody, CardHeader, Field, Input, PageHeader, QueryError, Textarea, useToast } from '@/components/admin';
import { ToggleRow } from '@/components/admin/forms/ToggleRow';
import { MediaField } from '@/components/admin/media/MediaField';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetSettingsQuery, useSaveSettingsMutation, type AdminSettings } from '@/store/admin/settingsApi';
import { errorMessage, fieldErrors } from '@/store/baseApi';

/** The part of the settings document the form edits (the server's timestamp is not editable). */
type Draft = Omit<AdminSettings, 'updatedAt'>;

const toDraft = ({ updatedAt: _stamp, ...rest }: AdminSettings): Draft => rest;
const parseEmails = (text: string) => text.split(/[\s,;]+/).filter(Boolean);

function SettingsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-2" aria-busy>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-64 rounded-card" />
      ))}
    </div>
  );
}

interface FormProps {
  initial: Draft;
}

function SettingsForm({ initial }: FormProps) {
  const toast = useToast();
  const [save, { isLoading: saving }] = useSaveSettingsMutation();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  // The e-mail list is typed as plain text and turned into addresses on every change.
  const [emailsText, setEmailsText] = useState(initial.notifications.emails.join(', '));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  // Browsers ask before closing a tab with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const change = (patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors({});
  };
  const business = (patch: Partial<Draft['business']>) => change({ business: { ...draft.business, ...patch } });
  const whatsapp = (patch: Partial<Draft['whatsapp']>) => change({ whatsapp: { ...draft.whatsapp, ...patch } });
  const social = (patch: Partial<Draft['social']>) => change({ social: { ...draft.social, ...patch } });
  const tracking = (patch: Partial<Draft['tracking']>) => change({ tracking: { ...draft.tracking, ...patch } });
  const defaults = (patch: Partial<Draft['productDefaults']>) => change({ productDefaults: { ...draft.productDefaults, ...patch } });

  async function submit() {
    const parsed = settingsInput.safeParse(draft);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path.join('.'), i.message])));
      toast('Please check the highlighted fields', 'error');
      return;
    }
    try {
      const result = await save(parsed.data).unwrap();
      const next = toDraft(result);
      setSaved(next);
      setDraft(next);
      setEmailsText(next.notifications.emails.join(', '));
      toast('Settings saved');
    } catch (err) {
      setErrors(fieldErrors(err));
      toast(errorMessage(err), 'error');
    }
  }

  const lineSheetReady = !!draft.lineSheet.mediaId;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details, notifications and the defaults every product page uses."
        actions={
          <>
            {dirty && <span className="text-[13px] text-ink-mute">Unsaved changes</span>}
            <Button variant="primary" onClick={submit} disabled={!dirty || saving}>
              Save settings
            </Button>
          </>
        }
      />

      {Object.keys(errors).length > 0 && (
        <Callout tone="error" className="mb-4">
          Some fields need attention: {Object.entries(errors).slice(0, 3).map(([k, v]) => `${k.split('.').pop()}: ${v}`).join(' · ')}
        </Callout>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Business" />
            <CardBody className="space-y-3.5">
              <Field label="Business name" htmlFor="b-name" error={errors['business.name']}>
                <Input id="b-name" value={draft.business.name} onChange={(e) => business({ name: e.target.value })} />
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Contact email" htmlFor="b-email" error={errors['business.email']}>
                  <Input id="b-email" type="email" value={draft.business.email} onChange={(e) => business({ email: e.target.value })} invalid={!!errors['business.email']} />
                </Field>
                <Field label="Phone" htmlFor="b-phone" error={errors['business.phone']}>
                  <Input id="b-phone" value={draft.business.phone} onChange={(e) => business({ phone: e.target.value })} />
                </Field>
              </div>
              <Field label="Address" htmlFor="b-address" error={errors['business.address']}>
                <Input id="b-address" value={draft.business.address} onChange={(e) => business({ address: e.target.value })} />
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="WhatsApp and social" />
            <CardBody className="space-y-3.5">
              <Field label="WhatsApp number" htmlFor="w-number" hint="With the country code, e.g. +44 7000 000000. Used for the click-to-chat buttons." error={errors['whatsapp.number']}>
                <Input id="w-number" value={draft.whatsapp.number} onChange={(e) => whatsapp({ number: e.target.value })} />
              </Field>
              <Field label="WhatsApp message template" htmlFor="w-template" hint="{product} and {code} are filled in automatically." error={errors['whatsapp.template']}>
                <Input id="w-template" value={draft.whatsapp.template} onChange={(e) => whatsapp({ template: e.target.value })} />
              </Field>
              <div className="grid gap-3.5 sm:grid-cols-3">
                <Field label="Instagram" htmlFor="s-ig">
                  <Input id="s-ig" value={draft.social.instagram} onChange={(e) => social({ instagram: e.target.value })} placeholder="https://instagram.com/…" />
                </Field>
                <Field label="TikTok" htmlFor="s-tt">
                  <Input id="s-tt" value={draft.social.tiktok} onChange={(e) => social({ tiktok: e.target.value })} placeholder="https://tiktok.com/@…" />
                </Field>
                <Field label="Facebook" htmlFor="s-fb">
                  <Input id="s-fb" value={draft.social.facebook} onChange={(e) => social({ facebook: e.target.value })} placeholder="https://facebook.com/…" />
                </Field>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Enquiry notifications" />
            <CardBody className="space-y-3.5">
              <Field
                label="Send new-enquiry e-mails to"
                htmlFor="n-emails"
                hint="Separate several addresses with commas. If this is empty, the server's default address is used."
                error={Object.entries(errors).find(([k]) => k.startsWith('notifications.emails'))?.[1]}
              >
                <Input
                  id="n-emails"
                  value={emailsText}
                  onChange={(e) => {
                    setEmailsText(e.target.value);
                    change({ notifications: { ...draft.notifications, emails: parseEmails(e.target.value) } });
                  }}
                  placeholder="orders@example.com, owner@example.com"
                />
              </Field>
              <ToggleRow
                checked={draft.notifications.sendConfirmation}
                onChange={(sendConfirmation) => change({ notifications: { ...draft.notifications, sendConfirmation } })}
                label="Send a confirmation e-mail to the retailer"
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Privacy and tracking" />
            <CardBody className="space-y-3.5">
              <ToggleRow checked={draft.tracking.banner} onChange={(banner) => tracking({ banner })} label="Show the cookie banner" />
              <ToggleRow checked={draft.tracking.journey} onChange={(journey) => tracking({ journey })} label="Record the browsing journey (only when the visitor accepts)" />
              <Callout>Enquiries always work, even if a visitor declines tracking. Their journey then shows as “unavailable”.</Callout>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title={
                <>
                  Product page defaults
                  <span className="mt-0.5 block font-sans text-[13px] text-ink-soft">Shown on every product unless a product overrides it.</span>
                </>
              }
            />
            <CardBody className="space-y-3.5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Dispatch note" htmlFor="d-dispatch" error={errors['productDefaults.dispatch']}>
                  <Input id="d-dispatch" value={draft.productDefaults.dispatch} onChange={(e) => defaults({ dispatch: e.target.value })} />
                </Field>
                <Field label="Samples" htmlFor="d-samples" error={errors['productDefaults.samples']}>
                  <Input id="d-samples" value={draft.productDefaults.samples} onChange={(e) => defaults({ samples: e.target.value })} />
                </Field>
              </div>
              <Field label="Price line" htmlFor="d-price" error={errors['productDefaults.priceLine']}>
                <Input id="d-price" value={draft.productDefaults.priceLine} onChange={(e) => defaults({ priceLine: e.target.value })} />
              </Field>
              <Field label="Packing & delivery text" htmlFor="d-ship" error={errors['productDefaults.shipText']}>
                <Textarea id="d-ship" value={draft.productDefaults.shipText} maxLength={1500} className="min-h-[110px]" onChange={(e) => defaults({ shipText: e.target.value })} />
              </Field>
              <Field label="Wholesale tiers footnote" htmlFor="d-foot" error={errors['productDefaults.tiersFootnote']}>
                <Input id="d-foot" value={draft.productDefaults.tiersFootnote} onChange={(e) => defaults({ tiersFootnote: e.target.value })} />
              </Field>
              <Callout tone="warn">Please confirm these claims with the client (dispatch time, samples, delivery) before launch.</Callout>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Trade line sheet" />
            <CardBody className="space-y-3.5">
              <div>
                <span className="mb-[5px] block text-[12.5px] font-semibold text-ink-soft">Line sheet PDF</span>
                <MediaField
                  mediaId={draft.lineSheet.mediaId}
                  allowed={['document']}
                  noun="PDF"
                  onChange={(mediaId) => change({ lineSheet: { enabled: mediaId ? draft.lineSheet.enabled : false, mediaId } })}
                />
              </div>
              <ToggleRow
                checked={draft.lineSheet.enabled && lineSheetReady}
                onChange={(enabled) => change({ lineSheet: { ...draft.lineSheet, enabled } })}
                label="Offer the line sheet on the website"
                hint={lineSheetReady ? 'Visitors who request it become a lead in Enquiries.' : 'Upload a PDF first, so the website never promises something that is not there.'}
                className={lineSheetReady ? undefined : 'pointer-events-none opacity-50'}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

/** Business-wide settings: contact details, notifications and product page defaults. */
export function SettingsScreen() {
  const { data, isLoading, isError, error, refetch } = useGetSettingsQuery();
  if (isError) {
    return (
      <Card>
        <QueryError error={error} onRetry={refetch} />
      </Card>
    );
  }
  if (isLoading || !data) return <SettingsSkeleton />;
  return <SettingsForm initial={toDraft(data)} />;
}
