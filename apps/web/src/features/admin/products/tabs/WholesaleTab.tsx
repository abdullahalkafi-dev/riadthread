'use client';

import { Button, Card, CardBody, CardHeader, Field, Icon, Input, Select } from '@/components/admin';
import { NumberInput } from '@/components/admin/forms/NumberInput';
import type { TabProps } from './types';

export function WholesaleTab({ draft, update, errors }: TabProps) {
  const w = draft.wholesale;
  const set = (patch: Partial<typeof w>) => update({ wholesale: { ...w, ...patch } });
  const setTier = (index: number, patch: Partial<(typeof w.tiers)[number]>) => set({ tiers: w.tiers.map((t, i) => (i === index ? { ...t, ...patch } : t)) });

  return (
    <div className="space-y-4">
      <Card>
        <CardBody className="space-y-4 pt-[18px]">
          <div className="grid gap-3.5 md:grid-cols-3">
            <Field label="MOQ (units)" htmlFor="w-moq" hint="The progress bar on the product page counts toward this." error={errors['wholesale.moq']}>
              <NumberInput id="w-moq" min={1} max={100000} value={w.moq} onChange={(moq) => set({ moq })} />
            </Field>
            <Field label="Pack info" htmlFor="w-pack" hint="Shown as “MOQ 12 units · Pack of 6 · S–XXL”." error={errors['wholesale.packText']}>
              <Input id="w-pack" value={w.packText} onChange={(e) => set({ packText: e.target.value })} placeholder="Pack of 6 · S–XXL" />
            </Field>
            <Field label="Pack size (units)" htmlFor="w-size" hint="Used by “Spread the minimum for me”." error={errors['wholesale.packSize']}>
              <NumberInput id="w-size" min={1} max={10000} value={w.packSize} onChange={(packSize) => set({ packSize })} />
            </Field>
          </div>
          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Price display" htmlFor="w-price" hint="Launch default is hidden. Switching later needs no re-entry.">
              <Select id="w-price" value={w.priceMode} onChange={(e) => set({ priceMode: e.target.value as typeof w.priceMode })}>
                <option value="hidden">Hidden: “Trade price on request”</option>
                <option value="from">“From £x”</option>
                <option value="tiers">Tier table with prices</option>
              </Select>
            </Field>
            <Field label="Below-MOQ requests" htmlFor="w-below" hint="Confirm with the client which they prefer.">
              <Select id="w-below" value={w.belowMoq} onChange={(e) => set({ belowMoq: e.target.value as typeof w.belowMoq })}>
                <option value="allow">Warn, but let them send the enquiry</option>
                <option value="block">Block until MOQ is reached</option>
              </Select>
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <>
              Wholesale tiers
              <span className="mt-0.5 block font-sans text-[13px] text-ink-soft">Labels are discounts or “Trade price”, never fixed prices.</span>
            </>
          }
          action={
            <Button size="sm" onClick={() => set({ tiers: [...w.tiers, { range: '', label: '' }] })} disabled={w.tiers.length >= 8}>
              <Icon name="plus" />
              Add tier
            </Button>
          }
        />
        <CardBody className="overflow-x-auto">
          {w.tiers.length === 0 ? (
            <p className="text-sm text-ink-soft">No tiers. The “Wholesale tiers” tab is hidden on the product page.</p>
          ) : (
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[.1em] text-ink-mute">
                  <th className="px-2 pb-2">Quantity range</th>
                  <th className="px-2 pb-2">Pricing label</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {w.tiers.map((t, i) => (
                  <tr key={i}>
                    <td className="px-1.5 py-1">
                      <Input value={t.range} onChange={(e) => setTier(i, { range: e.target.value })} aria-label={`Tier ${i + 1} quantity range`} placeholder="12 – 47 units" invalid={!!errors[`wholesale.tiers.${i}.range`]} className="!py-[7px]" />
                    </td>
                    <td className="px-1.5 py-1">
                      <Input value={t.label} onChange={(e) => setTier(i, { label: e.target.value })} aria-label={`Tier ${i + 1} pricing label`} placeholder="Trade price" invalid={!!errors[`wholesale.tiers.${i}.label`]} className="!py-[7px]" />
                    </td>
                    <td>
                      <Button size="sm" variant="danger" aria-label={`Remove tier ${i + 1}`} onClick={() => set({ tiers: w.tiers.filter((_, j) => j !== i) })}>
                        <Icon name="x" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
