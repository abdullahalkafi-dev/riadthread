import { errorMessage } from '@/store/baseApi';
import { Button } from './Button';
import { Callout } from './Layout';

interface QueryErrorProps {
  error: unknown;
  onRetry?: () => void;
}

/** What to show when a list or panel fails to load: the API's message and a retry button. */
export function QueryError({ error, onRetry }: QueryErrorProps) {
  return (
    <div className="space-y-3 p-4">
      <Callout tone="error">{errorMessage(error, 'We could not load this. Please try again')}</Callout>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
