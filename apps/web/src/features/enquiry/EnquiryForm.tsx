'use client';

import Link from 'next/link';
import { useCallback, useState, type FormEvent } from 'react';
import { BUSINESS_TYPES, type EntryPoint } from '@riad/shared';
import { whatsappLink } from '@/lib/contact';
import { clearList } from '@/store/site/enquiry.slice';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { useGetTrackingSettingsQuery } from '../tracking/trackingApi';
import { ChipGroup, Field, SegGroup } from './fields';
import { linesToItems } from './items';
import { Turnstile, turnstileEnabled } from './Turnstile';
import { EMPTY_CONTACT, useEnquirySubmission, type ContactValues, type EnquiryItemInput } from './useEnquirySubmission';

interface Props {
  entryPoint: EntryPoint;
  /** Overrides the visitor's enquiry list, e.g. the single product in "Ask about this style". */
  items?: EnquiryItemInput[];
  /** Shown read-only above the fields in the quick enquiry. */
  productLabel?: string;
  /** Called once the enquiry was accepted. */
  onSent?: () => void;
  /** Lets a drawer move its step indicator along with the visitor. */
  onStep?: (step: 1 | 2 | 3) => void;
}

const REACH = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
] as const;

const TYPES = BUSINESS_TYPES.map((t) => ({ value: t, label: t === 'Mosque or centre shop' ? 'Mosque / centre shop' : t }));

/**
 * The enquiry form. One component, three looks from the design: the full
 * "Start a conversation" card (home page and enquiry page), the compact form at
 * the bottom of the enquiry list, and the short "Ask about this style" form.
 */
export function EnquiryForm({ entryPoint, items, productLabel, onSent, onStep }: Props) {
  const dispatch = useSiteDispatch();
  const lines = useSiteSelector((s) => s.enquiryList.lines);
  const { data: settings } = useGetTrackingSettingsQuery();
  const { submit, errors, formError, pending, reference, reset } = useEnquirySubmission();

  const variant = entryPoint === 'quick_enquiry' ? 'quick' : entryPoint === 'enquiry_list' ? 'compact' : 'full';
  const [values, setValues] = useState<ContactValues>({
    ...EMPTY_CONTACT,
    ...(variant === 'full' ? { type: 'Boutique', preferredContact: 'whatsapp' } : {}),
  });
  const [honeypot, setHoneypot] = useState('');
  const [token, setToken] = useState('');
  const [widgetKey, setWidgetKey] = useState(0);

  const set = <K extends keyof ContactValues>(key: K) => (value: ContactValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    onStep?.(2);
  };
  const onToken = useCallback((t: string) => setToken(t), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const payloadItems = items ?? linesToItems(lines);
    const ok = await submit({ entryPoint, values, items: payloadItems, turnstileToken: token, honeypot });
    if (ok) {
      // The list was sent, so it starts empty again. A single-product question leaves it alone.
      if (!items) dispatch(clearList());
      onStep?.(3);
      onSent?.();
    } else if (turnstileEnabled) {
      // A check token works once; ask for a fresh one before the next try.
      setToken('');
      setWidgetKey((k) => k + 1);
    }
  }

  const whatsapp = settings ? whatsappLink(settings) : null;

  if (reference) {
    return <SentMessage variant={variant} reference={reference} onAnother={() => { reset(); onStep?.(1); }} />;
  }

  const trap = (
    // Hidden trap for bots: people never see it or tab to it.
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </label>
    </div>
  );
  const alert = formError && (
    <p role="alert" className="rounded-xl bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-700">
      {formError}
    </p>
  );
  const check = turnstileEnabled && <Turnstile key={widgetKey} onToken={onToken} />;
  const submitLabel = pending ? 'Sending…' : variant === 'quick' ? 'Send' : 'Send enquiry';
  const button = (
    <button type="submit" disabled={pending} className="btn-terra w-full rounded-full py-4 text-[15px] disabled:opacity-60">
      {submitLabel}
    </button>
  );

  if (variant === 'compact') {
    return (
      <form onSubmit={onSubmit} noValidate className="relative space-y-3 border-t border-ink/10 bg-sand-100 p-6">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" showLabel={false} placeholder="Name" autoComplete="name" required value={values.name} onChange={set('name')} error={errors['contact.name']} />
          <Field label="Business" showLabel={false} placeholder="Business" autoComplete="organization" required value={values.business} onChange={set('business')} error={errors['contact.business']} />
        </div>
        <Field label="Email" showLabel={false} placeholder="Email" type="email" autoComplete="email" required value={values.email} onChange={set('email')} error={errors['contact.email']} />
        <Field label="Phone or WhatsApp" showLabel={false} placeholder="Phone / WhatsApp" type="tel" autoComplete="tel" required value={values.phone} onChange={set('phone')} error={errors['contact.phone']} />
        {errors.message && <p role="alert" className="text-[13px] text-terracotta-600">{errors.message}</p>}
        {check}
        {alert}
        {trap}
        {button}
      </form>
    );
  }

  if (variant === 'quick') {
    return (
      <form onSubmit={onSubmit} noValidate className="relative space-y-3 p-6">
        {productLabel && <Field label="Product" showLabel={false} readOnly value={productLabel} onChange={() => undefined} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" showLabel={false} placeholder="Name" autoComplete="name" required value={values.name} onChange={set('name')} error={errors['contact.name']} />
          <Field label="Business" showLabel={false} placeholder="Business" autoComplete="organization" required value={values.business} onChange={set('business')} error={errors['contact.business']} />
        </div>
        <Field label="Email" showLabel={false} placeholder="Email" type="email" autoComplete="email" required value={values.email} onChange={set('email')} error={errors['contact.email']} />
        <Field label="Phone or WhatsApp" showLabel={false} placeholder="Phone / WhatsApp" type="tel" autoComplete="tel" required value={values.phone} onChange={set('phone')} error={errors['contact.phone']} />
        <Field label="Your question" showLabel={false} rows={4} placeholder="Your question, quantities, delivery date…" value={values.message} onChange={set('message')} error={errors.message} />
        {check}
        {alert}
        {trap}
        {button}
      </form>
    );
  }

  const attached = lines.length;
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative overflow-hidden rounded-[24px] bg-sand-50 shadow-[0_40px_80px_-40px_rgba(117,56,35,.5)]"
    >
      <div className="zellige-strip" />
      <div className="p-6 sm:p-10">
        <p className="text-[12px] uppercase tracking-[.3em] text-terracotta-600">Trade enquiry</p>
        <h3 className="mt-2 font-display text-3xl sm:text-4xl">Start a conversation</h3>
        {attached > 0 && (
          <p className="mt-3 rounded-xl bg-sand-100 px-4 py-3 text-sm text-ink-soft">
            Your enquiry list ({attached} {attached === 1 ? 'style' : 'styles'}) will be sent with this message.{' '}
            <Link href="/enquiry" className="text-terracotta-600 underline underline-offset-4">Review it</Link>
          </p>
        )}
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" required placeholder="Yusuf Rahman" autoComplete="name" value={values.name} onChange={set('name')} error={errors['contact.name']} />
          <Field label="Business name" required placeholder="Noor Modest Wear" autoComplete="organization" value={values.business} onChange={set('business')} error={errors['contact.business']} />
          <Field label="Email" required type="email" placeholder="you@yourshop.co.uk" autoComplete="email" value={values.email} onChange={set('email')} error={errors['contact.email']} />
          <Field label="Phone / WhatsApp" required type="tel" placeholder="+44 7700 900000" autoComplete="tel" value={values.phone} onChange={set('phone')} error={errors['contact.phone']} />
        </div>
        <div className="mt-6">
          <ChipGroup legend="Type of business" name={`biz-${entryPoint}`} options={TYPES} value={values.type as (typeof BUSINESS_TYPES)[number] | ''} onChange={set('type')} />
        </div>
        <Field className="mt-6" label="What would you like to stock?" rows={3} placeholder="Styles, colours, rough quantities, when you need them…" value={values.message} onChange={set('message')} error={errors.message} />
        <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <SegGroup legend="Best way to reach you" name={`via-${entryPoint}`} options={REACH} value={values.preferredContact as (typeof REACH)[number]['value'] | ''} onChange={set('preferredContact')} />
          <Field className="sm:w-52" label="Needed by (optional)" type="date" value={values.deliveryBy} onChange={set('deliveryBy')} error={errors.deliveryBy} />
        </div>
        <div className="mt-6 space-y-4">
          {check}
          {alert}
        </div>
        {trap}
        <div className="mt-6">{button}</div>
        {whatsapp && (
          <p className="mt-4 text-center text-sm text-ink-soft">
            Prefer to chat?{' '}
            <a href={whatsapp} className="text-[#0f6b3a] underline underline-offset-4">Message us on WhatsApp</a>
          </p>
        )}
      </div>
    </form>
  );
}

function SentMessage({ variant, reference, onAnother }: { variant: 'full' | 'compact' | 'quick'; reference: string; onAnother: () => void }) {
  if (variant === 'compact') {
    return (
      <div role="status" className="border-t border-ink/10 bg-sand-100 p-6">
        <p className="font-display text-2xl">Sent — <span>{reference}</span></p>
        <p className="mt-1 text-sm text-ink-soft">We&apos;ll reply within one working day.</p>
      </div>
    );
  }
  return (
    <div role="status" className={variant === 'full' ? 'rounded-[24px] bg-sand-50 p-6 text-center shadow-[0_40px_80px_-40px_rgba(117,56,35,.5)] sm:p-10' : 'p-6'}>
      <p className="font-ruqaa text-3xl text-terracotta-500 sm:text-4xl">شكرا</p>
      <h3 className="mt-1 font-display text-3xl sm:text-4xl">Thank you</h3>
      <p className="mt-2 text-ink-soft">
        Reference <strong>{reference}</strong>. We&apos;ll be in touch within one working day.
      </p>
      <button type="button" onClick={onAnother} className="mt-6 text-sm text-terracotta-600 underline underline-offset-4">
        Send another enquiry
      </button>
    </div>
  );
}
