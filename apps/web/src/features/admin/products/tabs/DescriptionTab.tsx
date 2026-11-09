'use client';

import { Card, CardBody, CardHeader, Field, Input, Textarea } from '@/components/admin';
import { RichTextEditor } from '@/components/admin/forms/RichTextEditor';
import type { TabProps } from './types';

export function DescriptionTab({ draft, update, errors }: TabProps) {
  const setSpecs = (patch: Partial<typeof draft.specs>) => update({ specs: { ...draft.specs, ...patch } });
  const setOverrides = (patch: Partial<typeof draft.overrides>) => update({ overrides: { ...draft.overrides, ...patch } });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Description" />
        <CardBody className="space-y-2">
          <RichTextEditor label="Description" value={draft.descriptionHtml} onChange={(descriptionHtml) => update({ descriptionHtml })} minHeight={180} />
          <p className="text-xs text-ink-mute">Shown in the “Description” tab on the product page.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Specifications" />
        <CardBody className="grid gap-3.5 md:grid-cols-2">
          <Field label="Fabric" htmlFor="s-fabric" error={errors['specs.fabric']}>
            <Input id="s-fabric" value={draft.specs.fabric} onChange={(e) => setSpecs({ fabric: e.target.value })} placeholder="e.g. Silk chiffon" />
          </Field>
          <Field label="Fabric filter label" htmlFor="s-fabric-type" hint="One word shown in the catalogue Fabric filter, e.g. Chiffon. Leave empty to use the last word of the fabric.">
            <Input id="s-fabric-type" value={draft.specs.fabricType} onChange={(e) => setSpecs({ fabricType: e.target.value })} placeholder="Chiffon" />
          </Field>
          <Field label="Made in" htmlFor="s-origin">
            <Input id="s-origin" value={draft.specs.origin} onChange={(e) => setSpecs({ origin: e.target.value })} />
          </Field>
          <Field label="Care" htmlFor="s-care">
            <Input id="s-care" value={draft.specs.care} onChange={(e) => setSpecs({ care: e.target.value })} placeholder="Gentle 30° wash or dry clean; cool iron on reverse." />
          </Field>
          <Field label="Fit notes (optional)" htmlFor="s-fit" className="md:col-span-2">
            <Input id="s-fit" value={draft.specs.fit} onChange={(e) => setSpecs({ fit: e.target.value })} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            <>
              Product page info boxes
              <span className="mt-0.5 block font-sans text-[13px] text-ink-soft">Empty fields use the defaults from Settings.</span>
            </>
          }
        />
        <CardBody className="space-y-3.5">
          <div className="grid gap-3.5 md:grid-cols-2">
            <Field label="Dispatch" htmlFor="o-dispatch">
              <Input id="o-dispatch" value={draft.overrides.dispatch} onChange={(e) => setOverrides({ dispatch: e.target.value })} placeholder="Using the site default" />
            </Field>
            <Field label="Samples" htmlFor="o-samples">
              <Input id="o-samples" value={draft.overrides.samples} onChange={(e) => setOverrides({ samples: e.target.value })} placeholder="Using the site default" />
            </Field>
          </div>
          <Field label="Packing & delivery text" htmlFor="o-ship">
            <Textarea id="o-ship" value={draft.overrides.shipText} onChange={(e) => setOverrides({ shipText: e.target.value })} className="!min-h-[70px]" placeholder="Using the site default text" />
          </Field>
        </CardBody>
      </Card>
    </div>
  );
}
