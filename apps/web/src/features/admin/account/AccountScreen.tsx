'use client';

import { useState } from 'react';
import { changePasswordSchema } from '@riad/shared';
import { Button, Callout, Card, CardBody, CardHeader, Field, Input, PageHeader, useToast } from '@/components/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMeQuery } from '@/store/admin/authApi';
import { useChangePasswordMutation, useUpdateAccountMutation } from '@/store/admin/accountApi';
import { errorMessage, fieldErrors } from '@/store/baseApi';
import type { AdminUser } from '@/types/api';

function ProfileForm({ user }: { user: AdminUser }) {
  const toast = useToast();
  const [update, { isLoading, error }] = useUpdateAccountMutation();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const errors = fieldErrors(error);
  const changed = name.trim() !== user.name || email.trim().toLowerCase() !== user.email;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update({ name: name.trim(), email: email.trim() }).unwrap();
      toast('Account updated');
    } catch (err) {
      toast(errorMessage(err, 'The account could not be updated'), 'error');
    }
  }

  return (
    <Card>
      <CardHeader title="Your details" />
      <CardBody>
        <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
          <Field label="Name" htmlFor="acc-name" error={errors.name}>
            <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </Field>
          <Field label="Email" htmlFor="acc-email" error={errors.email} hint="This is the address you sign in with.">
            <Input id="acc-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <div>
            <Button type="submit" variant="primary" disabled={isLoading || !changed || !name.trim() || !email.trim()}>
              {isLoading ? 'Saving…' : 'Save details'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [change, { isLoading, error }] = useChangePasswordMutation();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [local, setLocal] = useState<Record<string, string>>({});
  const errors = { ...fieldErrors(error), ...local };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Same rules as the server, so mistakes show up before a round trip.
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
    const found: Record<string, string> = {};
    if (!parsed.success) for (const issue of parsed.error.issues) found[String(issue.path[0])] ??= issue.message;
    if (newPassword !== confirm) found.confirm = 'The two passwords do not match';
    setLocal(found);
    if (Object.keys(found).length) return;

    try {
      await change({ currentPassword, newPassword }).unwrap();
      toast('Password changed. Other devices have been signed out');
      setCurrent('');
      setNew('');
      setConfirm('');
    } catch (err) {
      toast(errorMessage(err, 'The password could not be changed'), 'error');
    }
  }

  return (
    <Card>
      <CardHeader title="Change password" />
      <CardBody>
        <form onSubmit={submit} className="flex flex-col gap-3.5" noValidate>
          <Field label="Current password" htmlFor="pw-current" error={errors.currentPassword}>
            <Input id="pw-current" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="New password" htmlFor="pw-new" error={errors.newPassword} hint="At least 10 characters.">
              <Input id="pw-new" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} />
            </Field>
            <Field label="Confirm new password" htmlFor="pw-confirm" error={errors.confirm}>
              <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
          </div>
          <Callout>Changing your password signs you out of every other device. This one stays signed in.</Callout>
          <div>
            <Button type="submit" variant="primary" disabled={isLoading || !currentPassword || !newPassword}>
              {isLoading ? 'Changing…' : 'Change password'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function AccountScreen() {
  const { data: user } = useMeQuery();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Account" description="Your sign-in details. Website and business settings live under Settings." />
      <div className="flex flex-col gap-[18px]">
        {user ? <ProfileForm key={user.email + user.name} user={user} /> : <Skeleton className="h-56 rounded-card" />}
        <PasswordForm />
      </div>
    </div>
  );
}
