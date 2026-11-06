// Container healthcheck shared by the API and the worker (same image).
//  - worker: has no HTTP port, so it proves it is alive by touching a
//    heartbeat file while it is connected to MongoDB and the queue.
//  - api:    answers GET /api/health.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HEARTBEAT = path.join(os.tmpdir(), 'riad-worker-heartbeat');
const MAX_AGE_MS = 90_000;

if (fs.existsSync(HEARTBEAT)) {
  const age = Date.now() - fs.statSync(HEARTBEAT).mtimeMs;
  process.exit(age < MAX_AGE_MS ? 0 : 1);
}

fetch(`http://127.0.0.1:${process.env.PORT || 4000}/api/health`, { signal: AbortSignal.timeout(4000) })
  .then((res) => process.exit(res.ok ? 0 : 1))
  .catch(() => process.exit(1));
