'use client';

import { useCallback, useRef, useState } from 'react';
import { createEnquirySchema, type CreateEnquiryInput, type EntryPoint } from '@riad/shared';
import { errorMessage, fieldErrors } from '@/store/baseApi';
import { useSiteStore } from '@/store/site/hooks';
import { journey } from '../tracking/journey';
import { trackEvent } from '../tracking/events';
import { buildTrackingContext } from '../tracking/trackingContext';
import { useGetTrackingSettingsQuery } from '../tracking/trackingApi';
import { useSubmitEnquiryMutation } from './enquiryApi';

export interface ContactValues {
  name: string;
  business: string;
  email: string;
  phone: string;
  type: string;
  city: string;
  message: string;
  preferredContact: string;
  deliveryBy: string;
}

export const EMPTY_CONTACT: ContactValues = {
  name: '',
  business: '',
  email: '',
  phone: '',
  type: '',
  city: '',
  message: '',
  preferredContact: '',
  deliveryBy: '',
};

export type EnquiryItemInput = CreateEnquiryInput['items'][number];

interface SubmitInput {
  entryPoint: EntryPoint;
  values: ContactValues;
  items: EnquiryItemInput[];
  turnstileToken?: string | undefined;
  /** The hidden trap field. People leave it empty; the API rejects a request that fills it. */
  honeypot?: string | undefined;
}

/** Wording the visitor will understand, in place of the schema's technical messages. */
const FIELD_LABEL: Record<string, string> = {
  'contact.name': 'your name',
  'contact.business': 'your business name',
  'contact.email': 'your email address',
  'contact.phone': 'your phone number',
};

function friendly(path: string, code: string, message: string): string {
  const label = FIELD_LABEL[path];
  if (!label) return message;
  if (code === 'invalid_format') return `Please enter a valid ${label.replace('your ', '')}`;
  if (code === 'too_small' || code === 'invalid_type') return `Please enter ${label}`;
  return message;
}

const omitEmpty = <T extends Record<string, string>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v.trim() !== '')) as Partial<T>;

/**
 * Sends an enquiry. It validates with the same schema the API uses, then submits
 * with one idempotency key per distinct request: a double click or a retry after
 * a dropped connection can never create a second enquiry, while a changed form
 * gets a fresh key.
 */
export function useEnquirySubmission() {
  const store = useSiteStore();
  const { data: settings } = useGetTrackingSettingsQuery();
  const [submitEnquiry, { isLoading }] = useSubmitEnquiryMutation();
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const inFlight = useRef(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const submit = useCallback(
    async ({ entryPoint, values, items, turnstileToken, honeypot }: SubmitInput): Promise<boolean> => {
      if (inFlight.current) return false;
      setFormError(null);

      const { type, city, message, preferredContact, deliveryBy, ...required } = values;
      const stable = {
        entryPoint,
        contact: { ...required, ...omitEmpty({ type, city }) },
        message: message.trim(),
        ...omitEmpty({ preferredContact, deliveryBy }),
        items,
      };

      // The same request keeps its key (safe retry); any change to it starts a new one.
      const signature = JSON.stringify(stable);
      if (attempt.current?.signature !== signature) {
        attempt.current = { signature, key: crypto.randomUUID() };
      }

      const payload = {
        ...stable,
        submissionKey: attempt.current.key,
        pageUrl: window.location.pathname,
        ...(turnstileToken ? { turnstileToken } : {}),
        ...(honeypot ? { website_url: honeypot } : {}),
        tracking: buildTrackingContext(store.getState().consent, settings?.tracking.journey !== false),
      };

      const parsed = createEnquirySchema.safeParse(payload);
      if (!parsed.success) {
        const found: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const path = issue.path.join('.');
          found[path] ??= friendly(path, issue.code, issue.message);
        }
        setErrors(found);
        setFormError('Please check the highlighted fields');
        return false;
      }
      setErrors({});

      inFlight.current = true;
      try {
        const result = await submitEnquiry(parsed.data).unwrap();
        attempt.current = null;
        setReference(result.ref);
        trackEvent({ type: 'form_submit', label: entryPoint });
        journey.note('sent an enquiry');
        return true;
      } catch (err) {
        const status = (err as { status?: number | string }).status;
        // The server treats a reused key with different content as a conflict: start fresh next time.
        if (status === 409) attempt.current = null;
        const fields = fieldErrors(err);
        if (Object.keys(fields).length) setErrors(fields);
        setFormError(errorMessage(err));
        return false;
      } finally {
        inFlight.current = false;
      }
    },
    [settings?.tracking.journey, store, submitEnquiry],
  );

  const reset = useCallback(() => {
    setErrors({});
    setFormError(null);
    setReference(null);
    attempt.current = null;
  }, []);

  return { submit, errors, formError, pending: isLoading, reference, reset };
}
