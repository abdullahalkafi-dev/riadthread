'use client';

import { ButtonLink, QueryError } from '@/components/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetOverviewQuery } from '@/store/admin/overviewApi';
import { useMeQuery } from '@/store/admin/authApi';
import { ActivityChart, AttentionCard, LatestCard, PipelineCard, TopProductsCard } from './OverviewPanels';
import { StatCards } from './StatCards';

const londonHour = () => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/London' }).format(new Date()));

function greeting() {
  const h = londonHour();
  if (h < 12) return 'Good morning';
  return h < 18 ? 'Good afternoon' : 'Good evening';
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function OverviewSkeleton() {
  return (
    <div className="space-y-[18px]" aria-busy>
      <Skeleton className="h-[88px] rounded-[18px]" />
      <div className="grid grid-cols-2 gap-3.5 min-[1101px]:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[110px] rounded-card" />
        ))}
      </div>
      <div className="grid gap-[18px] min-[1101px]:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-52 rounded-card" />
        <Skeleton className="h-52 rounded-card" />
      </div>
      <Skeleton className="h-64 rounded-card" />
    </div>
  );
}

export function OverviewScreen() {
  const me = useMeQuery();
  const { data, isLoading, error, refetch } = useGetOverviewQuery();

  if (isLoading) return <OverviewSkeleton />;
  if (error || !data) return <QueryError error={error} onRetry={refetch} />;

  const name = me.data?.name?.split(' ')[0] ?? 'there';
  return (
    <div>
      <div className="relative mb-[18px] flex flex-wrap items-center gap-[18px] overflow-hidden rounded-[18px] bg-[radial-gradient(90%_120%_at_15%_0%,#3557d6_0%,#1f348a_50%,#111c42_100%)] px-6 py-[22px] text-white">
        <div className="admin-star pointer-events-none absolute inset-0 opacity-10" aria-hidden />
        <div className="relative">
          <h2 className="font-display text-2xl font-normal sm:text-[26px]">
            {greeting()}, {name}
          </h2>
          <p className="mt-[3px] opacity-85">
            {plural(data.newCount, 'new enquiry', 'new enquiries')} waiting · {plural(data.hotOpen, 'hot lead', 'hot leads')} worth a call.
          </p>
        </div>
        <ButtonLink href="/admin/enquiries" className="relative border-transparent text-ink sm:ml-auto">
          Open enquiries
        </ButtonLink>
      </div>

      <StatCards overview={data} />

      <div className="mb-[18px] grid items-start gap-[18px] min-[1101px]:grid-cols-[1.6fr_1fr]">
        <PipelineCard counts={data.counts} />
        <AttentionCard items={data.needsAttention} />
      </div>
      <div className="mb-[18px] grid items-start gap-[18px] min-[1101px]:grid-cols-[1.6fr_1fr]">
        <ActivityChart series={data.series} />
        <TopProductsCard products={data.topProducts} />
      </div>
      <LatestCard items={data.latest} />
    </div>
  );
}
