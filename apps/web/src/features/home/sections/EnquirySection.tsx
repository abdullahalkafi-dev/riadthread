import { EnquiryForm } from '@/features/enquiry/EnquiryForm';
import { telLink } from '@/lib/contact';
import type { PublicSettings } from '@/types/api';
import { ENQUIRY_INVITE } from '../content';

const chip = 'rounded-full bg-sand-50/15 px-4 py-2 backdrop-blur';

/** Closing section of the home page: a warm invitation beside the trade enquiry form. */
export function EnquirySection({ settings }: { settings: Pick<PublicSettings, 'business'> }) {
  const { email, phone } = settings.business;
  const tel = telLink(phone);
  return (
    <section id="enquire" aria-labelledby="enquire-heading" className="scroll-mt-24 bg-sunset">
      <div className="mx-auto grid max-w-[1400px] items-stretch gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-10 lg:py-28">
        <div className="reveal relative min-h-[460px] overflow-hidden rounded-b-[24px] rounded-t-[999px] bg-majorelle-900 lg:col-span-5">
          <div className="star-bg absolute inset-0 opacity-[.07]" />
          <div className="absolute inset-0 bg-gradient-to-t from-night-950/85 via-night-950/10 to-transparent" />
          <div className="absolute inset-x-6 bottom-8 text-sand-50 sm:inset-x-10">
            <p className="font-ruqaa text-4xl text-brass-300">{ENQUIRY_INVITE.arabic}</p>
            <h2 id="enquire-heading" className="mt-2 font-display text-4xl leading-[1.02] sm:text-5xl">
              {ENQUIRY_INVITE.heading}
            </h2>
            <p className="mt-3 max-w-sm text-sand-200/90">{ENQUIRY_INVITE.text}</p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {email && (
                <a href={`mailto:${email}`} className={chip}>
                  {email}
                </a>
              )}
              {phone && (
                <a href={tel ?? undefined} className={chip}>
                  {phone}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="reveal lg:col-span-7" data-delay="1">
          <EnquiryForm entryPoint="home" />
        </div>
      </div>
    </section>
  );
}
