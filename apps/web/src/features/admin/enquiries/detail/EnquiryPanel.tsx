'use client';

import type { EnquiryStatus } from '@riad/shared';
import { ENQUIRY_STATUSES } from '@riad/shared';
import {
  Badge,
  Button,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  Icon,
  IconButton,
  QueryError,
  ScoreBadge,
  Select,
  useToast,
} from '@/components/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/admin-format';
import {
  useAddNoteMutation,
  useGetEnquiryQuery,
  useRetryEmailsMutation,
  useSetFollowUpMutation,
  useUpdateStatusMutation,
} from '@/store/admin/enquiriesApi';
import { errorMessage } from '@/store/baseApi';
import type { EnquiryDetail } from '@/types/api';
import { telLink, whatsappLink } from '../contactLinks';
import { statusLabel } from '../statusMeta';
import { Activity, ContactDetails, EmailStatus, FollowUp, Journey, Notes, RequestedItems, ScoreReasons, Section } from './DetailSections';

interface EnquiryPanelProps {
  /** Id of the enquiry to show; the panel is closed when undefined. */
  id: string | undefined;
  onClose: () => void;
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 p-[22px]" aria-busy>
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

/** A plain-text summary a person can paste into WhatsApp or a message. */
function summary(e: EnquiryDetail): string {
  const lines = e.items.map((i) => `- ${i.name}${i.colour ? ` (${i.colour})` : ''} x${i.qty}`);
  return [`${e.ref} · ${e.contact.business || e.contact.name}`, `${e.contact.name} · ${e.contact.phone} · ${e.contact.email}`, ...lines, e.message].filter(Boolean).join('\n');
}

function PanelContent({ enquiry, onClose }: { enquiry: EnquiryDetail; onClose: () => void }) {
  const toast = useToast();
  const [updateStatus, status] = useUpdateStatusMutation();
  const [addNote, note] = useAddNoteMutation();
  const [setFollowUp, followUp] = useSetFollowUpMutation();
  const [retryEmails, retry] = useRetryEmailsMutation();

  async function changeStatus(next: EnquiryStatus) {
    if (next === enquiry.status) return;
    try {
      await updateStatus({ id: enquiry.id, status: next }).unwrap();
      const name = enquiry.contact.business || enquiry.contact.name;
      if (next === 'spam') {
        toast('Marked as spam and hidden from the lists');
        onClose();
      } else {
        toast(next === 'confirmed' ? `${name} confirmed` : `${enquiry.ref} moved to ${statusLabel(next)}`);
      }
    } catch (error) {
      toast(errorMessage(error, 'The status could not be changed'), 'error');
    }
  }

  async function saveNote(text: string) {
    try {
      await addNote({ id: enquiry.id, text }).unwrap();
      toast('Note added');
      return true;
    } catch (error) {
      toast(errorMessage(error, 'The note could not be saved'), 'error');
      return false;
    }
  }

  async function saveFollowUp(date: string | null) {
    try {
      await setFollowUp({ id: enquiry.id, followUpAt: date }).unwrap();
      toast(date ? 'Follow-up saved' : 'Follow-up cleared');
    } catch (error) {
      toast(errorMessage(error, 'The follow-up could not be saved'), 'error');
    }
  }

  async function retryFailed() {
    try {
      const { retried } = await retryEmails(enquiry.id).unwrap();
      toast(retried ? 'Sending the failed e-mails again' : 'Nothing to retry');
    } catch (error) {
      toast(errorMessage(error, 'The e-mails could not be retried'), 'error');
    }
  }

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(summary(enquiry));
      toast('Details copied');
    } catch {
      toast('Your browser blocked copying', 'error');
    }
  }

  const { contact } = enquiry;
  return (
    <>
      <DrawerHeader>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-semibold tabular-nums text-ink-soft">
            {enquiry.ref} · {formatDateTime(enquiry.createdAt)}
          </span>
          <IconButton onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </IconButton>
        </div>
        <div className="mt-1.5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-normal leading-[1.15] sm:text-[26px]">{contact.business || contact.name}</h2>
            <div className="text-ink-soft">
              {[contact.name, contact.type, contact.city].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBadge level={enquiry.score.level} />
            <Select
              aria-label="Status"
              value={enquiry.status}
              disabled={status.isLoading}
              onChange={(e) => changeStatus(e.target.value as EnquiryStatus)}
              className="!w-auto !py-[7px] font-semibold"
            >
              {ENQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="inline-flex items-center gap-2 rounded-[9px] border border-admin-line bg-white px-[11px] py-1.5 text-[12.5px] font-semibold hover:border-sand-400" href={telLink(contact.phone)}>
            <Icon name="phone" />
            Call
          </a>
          <a className="inline-flex items-center gap-2 rounded-[9px] border border-admin-line bg-white px-[11px] py-1.5 text-[12.5px] font-semibold hover:border-sand-400" href={`mailto:${contact.email}`}>
            <Icon name="mail" />
            Email
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-[9px] border border-admin-line bg-white px-[11px] py-1.5 text-[12.5px] font-semibold text-[#128c4a] hover:border-sand-400"
            href={whatsappLink(contact.phone, contact.name, enquiry.ref)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="msg" />
            WhatsApp
          </a>
          <Button size="sm" variant="ghost" onClick={copyDetails}>
            <Icon name="copy" />
            Copy details
          </Button>
        </div>
      </DrawerHeader>

      <DrawerBody>
        <RequestedItems items={enquiry.items} qtyTotal={enquiry.qtyTotal} />
        {enquiry.message && (
          <Section title="Message">
            <div className="whitespace-pre-wrap rounded-card border border-admin-line bg-white px-3.5 py-3 shadow-card">{enquiry.message}</div>
          </Section>
        )}
        <ContactDetails enquiry={enquiry} />
        <FollowUp key={enquiry.followUpAt ?? 'none'} value={enquiry.followUpAt} saving={followUp.isLoading} onSave={saveFollowUp} />
        <Journey enquiry={enquiry} />
        <ScoreReasons level={enquiry.score.level} factors={enquiry.score.factors} />
        <Notes notes={enquiry.notes} saving={note.isLoading} onAdd={saveNote} />
        <EmailStatus state={enquiry.emailState} retrying={retry.isLoading} onRetry={retryFailed} />
        <Activity activity={enquiry.activity} />
      </DrawerBody>

      <DrawerFooter>
        {enquiry.status === 'confirmed' ? (
          <Badge tone="confirmed" className="!px-3.5 !py-2 !text-[13px]">
            Confirmed order
          </Badge>
        ) : (
          <Button variant="ok" disabled={status.isLoading} onClick={() => changeStatus('confirmed')}>
            <Icon name="check" />
            Mark as Confirmed
          </Button>
        )}
        {enquiry.status !== 'lost' && (
          <Button variant="danger" disabled={status.isLoading} onClick={() => changeStatus('lost')}>
            Mark as Lost
          </Button>
        )}
        {enquiry.status !== 'spam' && (
          <Button variant="ghost" disabled={status.isLoading} onClick={() => changeStatus('spam')}>
            Spam
          </Button>
        )}
      </DrawerFooter>
    </>
  );
}

/** Slide-over with everything about one enquiry. Opening it also marks the enquiry as read. */
export function EnquiryPanel({ id, onClose }: EnquiryPanelProps) {
  const { data, error, isLoading, refetch } = useGetEnquiryQuery(id ?? '', { skip: !id });

  return (
    <Drawer open={!!id} onClose={onClose} label="Enquiry details">
      {isLoading && <PanelSkeleton />}
      {error && !data && <QueryError error={error} onRetry={refetch} />}
      {data && <PanelContent enquiry={data} onClose={onClose} />}
    </Drawer>
  );
}
