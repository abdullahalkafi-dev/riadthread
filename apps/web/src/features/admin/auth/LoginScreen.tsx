'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button, Callout, Field, Input } from '@/components/admin';
import { errorMessage } from '@/store/baseApi';
import { useLoginMutation, useMeQuery } from '@/store/admin/authApi';

/** Only ever send people back to a dashboard page, never to another site. */
const safeNext = (value: string | null) => (value && value.startsWith('/admin') && !value.startsWith('/admin/login') ? value : '/admin');

function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [login, { isLoading, error }] = useLoginMutation();
  const me = useMeQuery();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Someone with a valid session who opens the sign-in page goes straight in.
  useEffect(() => {
    if (me.isSuccess) router.replace(next);
  }, [me.isSuccess, next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = await login({ email, password });
    if ('data' in result) router.replace(next);
  }

  return (
    <form onSubmit={submit} className="w-[min(400px,100%)]" noValidate>
      <Image src="/brand/favicon.png" alt="Riad Threads" width={64} height={64} className="mb-4 h-16 w-16 rounded-[14px]" priority />
      <h1 className="mb-1 font-display text-[32px] font-normal">Welcome back</h1>
      <p className="mb-[22px] text-ink-soft">Sign in to the Riad Threads dashboard.</p>
      <div className="flex flex-col gap-3">
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <Callout tone="error">{errorMessage(error, 'Email or password is incorrect')}</Callout>}
        <Button type="submit" variant="primary" className="w-full !py-3" disabled={isLoading || !email || !password}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </Button>
      </div>
    </form>
  );
}

export function LoginScreen() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-end overflow-hidden bg-[radial-gradient(90%_90%_at_20%_10%,#3557d6,#1f348a_50%,#111c42)] p-11 text-white lg:flex">
        <div className="admin-star absolute inset-0 opacity-[.12]" aria-hidden />
        <div className="absolute left-1/2 top-[8%] grid aspect-[3/4] w-[min(300px,60%)] -translate-x-1/2 place-items-center overflow-hidden rounded-t-full border-[6px] border-brass-400/70 bg-sand-50 shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]">
          <Image src="/brand/logo.png" alt="" width={240} height={240} className="h-auto w-[78%]" priority />
        </div>
        <h2 className="relative font-display text-[34px] font-normal leading-[1.1]">
          Every enquiry,
          <br />
          one calm place.
        </h2>
        <p className="relative mt-2 max-w-[360px] opacity-85">
          See who is asking, what they looked at, and move each lead from first message to confirmed order.
        </p>
      </div>
      <div className="grid place-items-center p-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
