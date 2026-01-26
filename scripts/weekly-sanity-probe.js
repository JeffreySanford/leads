/*
  Weekly sanity probe (standalone). Runs the ND-IT-Wide variant against SAM.gov
  Expects env.SAM_API_KEY to be set (via GitHub Actions secret).
  Outputs JSON: { count: number, samples: Array }

  NOTE: This script intentionally DOES NOT log the API key.
*/

const fetch = globalThis.fetch;
if (!fetch) {
  console.error('Fetch is not available in this Node runtime');
  process.exit(2);
}

const API = process.env.SAM_API_BASE || 'https://api.sam.gov/opportunities/v2/search';
const KEY = process.env.SAM_API_KEY;
if (!KEY) {
  console.error('Missing SAM_API_KEY (provide as env var)');
  process.exit(2);
}

function formatDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

async function search(params) {
  const qs = new URLSearchParams({
    api_key: KEY,
    postedFrom: params.postedFrom,
    postedTo: params.postedTo,
    limit: String(params.limit || 100),
    offset: String(params.offset || 0),
  });
  if (params.ncode) qs.append('ncode', params.ncode);
  if (params.typeOfSetAside) qs.append('typeOfSetAside', params.typeOfSetAside);
  if (params.pscPrefix) qs.append('pscPrefix', params.pscPrefix);

  const url = `${API}?${qs.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SAM.gov returned ${res.status}: ${res.statusText} - ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.opportunitiesData || [];
}

(async () => {
  try {
    const to = new Date();
    const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const params = {
      postedFrom: formatDate(from),
      postedTo: formatDate(to),
      limit: 50,
    };

    // ND-IT-Wide: try each NAICS in turn and accumulate results
    const naics = ['541511','541512','541513','541519','541690','518210','541715','541618'];
    let all = [];
    for (const n of naics) {
      const results = await search({ ...params, ncode: n });
      all = all.concat(results);
    }

    // dedupe by noticeId or solicitationNumber
    const map = new Map();
    for (const r of all) {
      const id = r.noticeId || r.solicitationNumber || JSON.stringify(r).slice(0, 40);
      if (!map.has(id)) map.set(id, r);
    }
    const unique = Array.from(map.values());

    // apply value filter <= 1_000_000 (if value exists)
    const filtered = unique.filter((opp) => {
      const v = (opp.baseAndAllOptionsValue || opp.estimatedValue || (opp.award && opp.award.amount)) || null;
      if (!v) return true; // keep if no value metadata
      const num = parseFloat(String(v).replace(/[^0-9.]/g, ''));
      return isNaN(num) ? true : num <= 1000000;
    });

    const samples = filtered.slice(0, 10).map((r) => ({
      noticeId: r.noticeId,
      solicitationNumber: r.solicitationNumber,
      title: r.title || r.noticeTitle,
      agency: r.agency || r.fullParentPathName || null,
      value: r.baseAndAllOptionsValue || r.estimatedValue || null,
    }));

    const out = { count: filtered.length, samples };
    console.log(JSON.stringify(out));
    process.stdout.write(JSON.stringify(out));
  } catch (err) {
    // avoid leaking secrets
    console.error('Probe failed:', err.message ? err.message : String(err).slice(0, 200));
    process.exit(3);
  }
})();
