import { json } from './_lib/env.js';
import { parseJobUrl } from './_lib/jobParser.js';

/** GET /api/parse-job?url=… → structured fields from a job posting. */
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) return json({ error: 'Missing url' }, 400);
  try {
    const job = await parseJobUrl(url);
    if (!job.title && !job.company) {
      return json({ error: "Couldn't find job details on that page. Fill them in manually." }, 422);
    }
    return json(job, 200, { 'cache-control': 'public, max-age=3600' });
  } catch (e) {
    const message = e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'That page took too long to respond';
    return json({ error: message }, 422);
  }
}
