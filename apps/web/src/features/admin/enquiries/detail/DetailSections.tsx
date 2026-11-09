'use client';

import { useState } from 'react';
import { Badge, Button, Callout, Card, Input, Textarea, type BadgeTone } from '@/components/admin';
import { followUpState, formatDate, formatDateTime, toDateInput } from '@/lib/admin-format';
import type { EmailState, EnquiryDetail } from '@/types/api';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h4 className="mb-[9px] text-[11px] font-bold uppercase tracking-[.12em] text-ink-mute">{title}</h4>
      {children}
    </section>
  );
}

/* ------------------------------ requested items ----------------------------- */

const sizesText = (sizes: EnquiryDetail['items'][number]['sizes']) =>
  sizes
    .filter((s) => s.qty)
    .map((s) => `${s.label}×${s.qty}`)
    .join(', ');

export function RequestedItems({ items, qtyTotal }: { items: EnquiryDetail['items']; qtyTotal: number }) {
  if (items.length === 0) {
    return (
      <Section title="Requested products">
        <p className="text-ink-soft">This was a general enquiry, with no products attached.</p>
      </Section>
    );
  }
  return (
    <Section title={`Requested products · ${items.length} · ${qtyTotal} units`}>
      {items.map((item, i) => (
        <div key={`${item.productId}-${item.colour}-${i}`} className="mb-2 flex gap-3 rounded-xl border border-admin-line bg-white p-2.5">
          {item.thumb ? (
            // eslint-disable-next-line @next/next/no-img-element -- stored thumbnail
            <img src={item.thumb} alt="" loading="lazy" className="h-[58px] w-[46px] flex-none rounded-t-full rounded-b-md border-2 border-white bg-sand-200 object-cover shadow-[0_0_0_1px_#e6dccb]" />
          ) : (
            <div className="h-[58px] w-[46px] flex-none rounded-t-full rounded-b-md bg-sand-200" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{item.name}</div>
            <div className="text-[12.5px] text-ink-soft">
              {item.code}
              {item.colour && ` · Colour: ${item.colour}`}
              {sizesText(item.sizes) && ` · ${sizesText(item.sizes)}`}
            </div>
          </div>
          <div className="text-right">
            <b>{item.qty}</b>
            <div className="text-[11.5px] text-ink-mute">units</div>
          </div>
        </div>
      ))}
      <p className="text-[11.5px] text-ink-mute">Snapshot taken at submission. Later product edits never change this request.</p>
    </Section>
  );
}

/* --------------------------------- contact --------------------------------- */

export function ContactDetails({ enquiry }: { enquiry: EnquiryDetail }) {
  const rows: Array<[string, string | null]> = [
    ['Email', enquiry.contact.email],
    ['Phone', enquiry.contact.phone],
    ['Business type', enquiry.contact.type || null],
    ['City', enquiry.contact.city || null],
    ['Website / IG', enquiry.contact.website || null],
    ['Prefers', enquiry.preferredContact ? enquiry.preferredContact[0]!.toUpperCase() + enquiry.preferredContact.slice(1) : null],
    ['Deliver by', enquiry.deliveryBy],
    ['Estimated units', enquiry.estimatedQty ? String(enquiry.estimatedQty) : null],
    ['Sent from', enquiry.pageUrl],
  ];
  return (
    <Section title="Contact & business">
      <dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-[7px] text-[13.5px] sm:grid-cols-[120px_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-ink-mute">{label}</dt>
            <dd className="m-0 break-words font-medium">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/* -------------------------------- follow-up -------------------------------- */

interface FollowUpProps {
  value: string | null;
  saving: boolean;
  onSave: (date: string | null) => void;
}

export function FollowUp({ value, saving, onSave }: FollowUpProps) {
  const [draft, setDraft] = useState(toDateInput(value));
  const state = followUpState(value);
  const label = { none: 'No follow-up set', overdue: 'Overdue', today: 'Due today', upcoming: 'Scheduled' }[state];

  return (
    <Section title="Follow-up">
      <div className="flex flex-wrap items-center gap-2.5">
        <Input type="date" aria-label="Follow-up date" value={draft} onChange={(e) => setDraft(e.target.value)} className="max-w-[200px]" />
        <Button size="sm" disabled={saving || !draft || draft === toDateInput(value)} onClick={() => onSave(draft)}>
          Save
        </Button>
        {value && (
          <Button
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => {
              setDraft('');
              onSave(null);
            }}
          >
            Clear
          </Button>
        )}
        <span className={state === 'overdue' ? 'text-[12.5px] font-semibold text-admin-danger' : 'text-[12.5px] text-ink-soft'}>
          {label}
          {value && ` · ${formatDate(value)}`}
        </span>
      </div>
    </Section>
  );
}

/* ---------------------------------- journey --------------------------------- */

export function Journey({ enquiry }: { enquiry: EnquiryDetail }) {
  if (!enquiry.trackingAccepted) {
    return (
      <Section title="Visitor journey">
        <Callout tone="warn">
          <b>Journey unavailable.</b> This visitor declined tracking (or it was blocked). The enquiry itself is complete, and is never treated as a weaker lead for
          this reason.
        </Callout>
      </Section>
    );
  }
  const steps = enquiry.journey ?? [];
  return (
    <Section title="Visitor journey">
      <Callout className="mb-3">
        <div>
          Visitor accepted tracking · source: <b>{enquiry.source ?? 'Direct'}</b>
          {enquiry.sourceDetail?.campaign && <> · campaign {enquiry.sourceDetail.campaign}</>}
        </div>
      </Callout>
      {steps.length === 0 ? (
        <p className="text-ink-soft">No page steps were recorded for this visit.</p>
      ) : (
        <ul className="admin-timeline m-0">
          {steps.map((step, i) => (
            <li key={i} data-kind={step.k}>
              <b className="font-semibold">{step.t}</b>
              {step.m && <small className="block text-xs text-ink-mute">{step.m}</small>}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ------------------------------- score reasons ------------------------------ */

export function ScoreReasons({ level, factors }: { level: string; factors: string[] }) {
  if (factors.length === 0) return null;
  return (
    <Section title={`Why “${level}”?`}>
      <div className="flex flex-wrap gap-1.5">
        {factors.map((f) => (
          <span key={f} className="rounded-full border border-admin-line bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink-soft">
            {f}
          </span>
        ))}
      </div>
    </Section>
  );
}

/* ----------------------------------- notes ---------------------------------- */

interface NotesProps {
  notes: EnquiryDetail['notes'];
  saving: boolean;
  onAdd: (text: string) => Promise<boolean>;
}

export function Notes({ notes, saving, onAdd }: NotesProps) {
  const [text, setText] = useState('');

  async function add() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (await onAdd(trimmed)) setText('');
  }

  return (
    <Section title="Notes">
      {notes.map((n) => (
        <div key={n.id} className="mb-2 rounded-[10px] border border-admin-line border-l-[3px] border-l-brass-400 bg-white px-3 py-2.5">
          <div className="text-[11.5px] text-ink-mute">
            {n.author} · {formatDateTime(n.at)}
          </div>
          <p className="whitespace-pre-wrap">{n.text}</p>
        </div>
      ))}
      <Textarea
        aria-label="New note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        placeholder="Add a private note: call outcome, price discussed, next step…"
      />
      <div className="mt-2">
        <Button size="sm" disabled={saving || !text.trim()} onClick={add}>
          Add note
        </Button>
      </div>
    </Section>
  );
}

/* ---------------------------------- activity -------------------------------- */

export function Activity({ activity }: { activity: EnquiryDetail['activity'] }) {
  return (
    <Section title="Activity">
      {[...activity].reverse().map((a, i) => (
        <div key={i} className="flex justify-between gap-3 border-b border-dashed border-admin-line py-[5px] text-[12.5px] text-ink-soft">
          <span>{a.text}</span>
          {a.at && <span className="flex-none text-ink-mute">{formatDateTime(a.at)}</span>}
        </div>
      ))}
    </Section>
  );
}

/* --------------------------------- e-mail status ---------------------------- */

const emailTone: Record<EmailState, BadgeTone> = { sent: 'ready', pending: 'processing', failed: 'failed', skipped: 'neutral' };
const emailLabel: Record<EmailState, string> = { sent: 'Sent', pending: 'Sending', failed: 'Failed', skipped: 'Not sent' };

interface EmailStatusProps {
  state: EnquiryDetail['emailState'];
  retrying: boolean;
  onRetry: () => void;
}

export function EmailStatus({ state, retrying, onRetry }: EmailStatusProps) {
  const rows: Array<[string, EmailState | undefined]> = [
    ['Alert to you', state?.notification],
    ['Confirmation to the retailer', state?.confirmation],
  ];
  const anyFailed = rows.some(([, s]) => s === 'failed');
  return (
    <Section title="E-mails">
      <Card className="divide-y divide-admin-line shadow-none">
        {rows.map(([label, s]) => (
          <div key={label} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13.5px]">
            <span>{label}</span>
            {s ? <Badge tone={emailTone[s]}>{emailLabel[s]}</Badge> : <span className="text-ink-mute">—</span>}
          </div>
        ))}
      </Card>
      {anyFailed && (
        <div className="mt-2.5">
          <Button size="sm" disabled={retrying} onClick={onRetry}>
            {retrying ? 'Retrying…' : 'Send failed e-mails again'}
          </Button>
        </div>
      )}
    </Section>
  );
}
