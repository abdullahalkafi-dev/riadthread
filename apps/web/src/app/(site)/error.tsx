'use client';

/** Shown when the API cannot be reached while a page renders. A retry re-runs the render. */
export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="font-ruqaa text-4xl text-terracotta-500">عذراً</p>
      <h1 className="mt-2 font-display text-4xl">We could not load this page</h1>
      <p className="mt-3 text-ink-soft">Something went wrong on our side. Please try again in a moment.</p>
      <button type="button" onClick={reset} className="btn-terra mt-8 rounded-full px-7 py-4 text-[15px]">
        Try again
      </button>
    </div>
  );
}
