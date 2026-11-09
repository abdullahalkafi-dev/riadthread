'use client';

import { useEffect, useState } from 'react';
import { Drawer } from '@/components/site/Drawer';
import { cn } from '@/lib/cn';
import { lineQty } from '@/store/site/enquiry.slice';
import { useSiteDispatch, useSiteSelector } from '@/store/site/hooks';
import { closeDrawer } from '@/store/site/ui.slice';
import { trackEvent } from '../tracking/events';
import { EmptyList, EnquiryLines } from './EnquiryLines';
import { EnquiryForm } from './EnquiryForm';
import { useEnquiryLines } from './useEnquiryLines';

const STEPS = ['1 · Your list', '2 · Your details', '3 · We reply'] as const;

/** The visitor's enquiry list, with the short form to send it. */
export function EnquiryDrawer() {
  const dispatch = useSiteDispatch();
  const open = useSiteSelector((s) => s.ui.drawer === 'enquiry');
  const { lines } = useEnquiryLines();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  /** Changing it gives the form a clean slate once a sent enquiry has been followed by a new list. */
  const [formKey, setFormKey] = useState(0);

  const close = () => dispatch(closeDrawer());
  const units = lines.reduce((n, l) => n + lineQty(l), 0);

  useEffect(() => {
    if (open) trackEvent({ type: 'form_open', label: 'enquiry list' });
  }, [open]);

  // Adding something new after sending starts a fresh enquiry.
  useEffect(() => {
    if (lines.length > 0 && step === 3) {
      setStep(1);
      setFormKey((k) => k + 1);
    }
  }, [lines.length, step]);

  return (
    <Drawer name="enquiry" side="right" label="Your enquiry list" className="flex h-full w-full flex-col bg-sand-50 sm:w-[480px]">
      <div className="border-b border-ink/10 px-6 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-2xl">Your enquiry list</p>
            <p className="text-xs text-ink-soft">
              {lines.length
                ? `${lines.length} product${lines.length > 1 ? 's' : ''} · ~${units} units`
                : 'No products yet'}
            </p>
          </div>
          <button type="button" onClick={close} className="p-2" aria-label="Close">
            ✕
          </button>
        </div>
        <ol className="mt-4 grid grid-cols-3 gap-2 text-[11px] uppercase tracking-[.12em]">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={step === i + 1 ? 'step' : undefined}
              className={cn('border-t-2 pt-2', step >= i + 1 ? 'border-terracotta-500 text-ink' : 'border-ink/15 text-ink-mute')}
            >
              {label}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {lines.length > 0 ? (
          <EnquiryLines lines={lines} onNavigate={close} />
        ) : step === 3 ? null : (
          <EmptyList onNavigate={close} />
        )}
      </div>

      {(lines.length > 0 || step === 3) && (
        <EnquiryForm key={formKey} entryPoint="enquiry_list" onStep={setStep} />
      )}
    </Drawer>
  );
}
