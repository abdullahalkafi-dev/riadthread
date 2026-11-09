import type { CreateEnquiryInput } from '@riad/shared';
import type { SiteState } from '@/store/site/store';
import { sessionAttribution } from './attribution';
import { journey } from './journey';

export type TrackingContext = NonNullable<CreateEnquiryInput['tracking']>;

/**
 * What a submission says about the visit. Without an explicit "accept" it is
 * only `{ consent: false }`: no ids, no pages, no source. That is what keeps
 * enquiries working while respecting the visitor's choice.
 */
export function buildTrackingContext(consent: SiteState['consent'], journeyEnabled: boolean): TrackingContext {
  const accepted = consent.status === 'accepted' && !!consent.visitorId && !!consent.sessionId;
  if (!accepted) return { consent: false };

  const steps = journeyEnabled ? journey.snapshot() : [];
  return {
    consent: true,
    policyVersion: consent.policyVersion,
    visitorId: consent.visitorId!,
    sessionId: consent.sessionId!,
    ...(steps.length ? { journey: steps } : {}),
    attribution: sessionAttribution(true) ?? {},
  };
}
