import { medicinesData } from '../data/healthData';
import { NearbyCareResult, OnlineSearchResult, GroundedSource } from '../types/health';

async function fetchJsonTimeout<T>(url: string, ms = 4500, init?: RequestInit): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export async function browserStaticOnlineSearch(
  query: string
): Promise<{ result: OnlineSearchResult; sources: GroundedSource[] }> {
  const q = query.trim();
  const cleanTerm = q.split(/\s+/)[0].replace(/[^a-zA-Z0-9-]/g, '') || q;

  const [wikiData, fdaData, pubData] = await Promise.all([
    fetchJsonTimeout<{ extract?: string }>(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanTerm)}?origin=*`
    ),
    fetchJsonTimeout<{
      results?: Array<{
        indications_and_usage?: string[];
        dosage_and_administration?: string[];
        warnings?: string[];
      }>;
    }>(
      `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(
        cleanTerm
      )}"+openfda.brand_name:"${encodeURIComponent(cleanTerm)}"&limit=1`
    ),
    fetchJsonTimeout<{ esearchresult?: { idlist?: string[] } }>(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
        q
      )}&retmode=json&retmax=3`
    ),
  ]);

  const ql = q.toLowerCase();
  const localMed = medicinesData.find(
    (m) =>
      m.name.toLowerCase().includes(ql) ||
      m.tags.toLowerCase().includes(ql) ||
      m.use.toLowerCase().includes(ql)
  );

  const wikiSummary = wikiData?.extract || '';
  const fdaRec = fdaData?.results?.[0];
  const fdaIndications = fdaRec?.indications_and_usage?.[0]?.slice(0, 380) || '';
  const fdaDosage = fdaRec?.dosage_and_administration?.[0]?.slice(0, 320) || '';
  const pubIds = (pubData?.esearchresult?.idlist || []).slice(0, 3);

  const sources: GroundedSource[] = [
    {
      title: 'Drugs.com Medicine Guide',
      uri: `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(q)}`,
    },
    {
      title: 'NIH MedlinePlus',
      uri: `https://vsearch.nlm.nih.gov/vivisimo/cgi-bin/query-meta?v%3Aproject=medlineplus&query=${encodeURIComponent(
        q
      )}`,
    },
    {
      title: 'WHO Global Health',
      uri: `https://www.who.int/home/search-results?indexCatalogue=genericsearchindex1&searchQuery=${encodeURIComponent(
        q
      )}`,
    },
    ...pubIds.map((id) => ({
      title: `PubMed Study #${id}`,
      uri: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
    })),
  ];

  const purpose =
    localMed?.use ||
    fdaIndications ||
    wikiSummary ||
    `Live clinical search links prepared for "${q}".`;
  const dose =
    localMed?.dose ||
    fdaDosage ||
    'Sahi mg/ml dose apne doctor ya pharmacist se age aur weight ke mutabiq verify karein.';
  const warn =
    localMed?.warn ||
    fdaRec?.warnings?.[0]?.slice(0, 260) ||
    'Koi bhi dawai bina doctor mashware aur allergy check ke na lein.';

  const result: OnlineSearchResult = {
    subjectTitle: localMed?.name || q,
    category: localMed || fdaIndications ? 'MEDICINE' : 'GENERAL',
    purposeOrCause: purpose,
    dosageAndUsage: dose,
    treatmentAndCare:
      wikiSummary.slice(0, 340) ||
      'Pani aur ORS jari rakhein, vitals (BP, Sugar, Fever) note karein aur clinical links check karein.',
    warnings: warn,
    checkedMarkers: [
      localMed ? '✅ 66-Medicine Database Match' : '',
      fdaIndications ? '✅ US OpenFDA Drug Label Matched' : '',
      wikiSummary ? '✅ Wikipedia Clinical Summary' : '',
      `🔬 PubMed Studies: ${pubIds.length}`,
    ].filter(Boolean),
    speakSummary: `${localMed?.name || q}. ${purpose.slice(0, 180)} ${dose.slice(0, 140)}`.trim(),
  };

  return { result, sources };
}

export async function browserStaticNearbyCare(opts: {
  lat?: number;
  lng?: number;
  cityQuery?: string;
  category: 'all' | 'hospital' | 'pharmacy' | 'lab' | 'imaging';
}): Promise<NearbyCareResult> {
  let useLat = typeof opts.lat === 'number' && !isNaN(opts.lat) ? opts.lat : null;
  let useLng = typeof opts.lng === 'number' && !isNaN(opts.lng) ? opts.lng : null;
  let resolvedArea = (opts.cityQuery || '').trim();

  if ((useLat === null || useLng === null) && resolvedArea) {
    const geo = await fetchJsonTimeout<{
      features?: Array<{
        geometry?: { coordinates?: [number, number] };
        properties?: { name?: string; city?: string; country?: string };
      }>;
    }>(`https://photon.komoot.io/api/?q=${encodeURIComponent(resolvedArea)}&limit=1`);
    const feat = geo?.features?.[0];
    if (feat?.geometry?.coordinates) {
      useLng = feat.geometry.coordinates[0];
      useLat = feat.geometry.coordinates[1];
      resolvedArea =
        [feat.properties?.name, feat.properties?.city, feat.properties?.country]
          .filter(Boolean)
          .join(', ') || resolvedArea;
    }
  }

  type CatKey = 'hospital' | 'pharmacy' | 'lab' | 'imaging';
  interface Item {
    name: string;
    type: string;
    catKey: CatKey;
    distanceKm: number;
    address: string;
    mapsUrl: string;
  }

  const collected: Item[] = [];
  const seen = new Set<string>();

  if (useLat !== null && useLng !== null) {
    const queries: Array<{ q: string; catKey: CatKey }> =
      opts.category === 'all'
        ? [
            { q: 'hospital', catKey: 'hospital' },
            { q: 'pharmacy', catKey: 'pharmacy' },
            { q: 'laboratory', catKey: 'lab' },
            { q: 'clinic', catKey: 'imaging' },
          ]
        : opts.category === 'imaging'
          ? [
              { q: 'ultrasound', catKey: 'imaging' },
              { q: 'clinic', catKey: 'imaging' },
            ]
          : [{ q: opts.category === 'lab' ? 'laboratory' : opts.category, catKey: opts.category }];

    await Promise.all(
      queries.map(async (item) => {
        const res = await fetchJsonTimeout<{
          features?: Array<{
            geometry?: { coordinates?: [number, number] };
            properties?: {
              name?: string;
              osm_value?: string;
              street?: string;
              district?: string;
              city?: string;
            };
          }>;
        }>(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            item.q
          )}&lat=${useLat}&lon=${useLng}&limit=10`
        );
        (res?.features || []).forEach((f) => {
          const coords = f.geometry?.coordinates;
          const p = f.properties;
          if (!coords || !p?.name) return;
          const [pLon, pLat] = coords;
          const dist = haversineKm(useLat!, useLng!, pLat, pLon);
          if (dist > 25) return;
          const key = p.name.trim().toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);

          const rawKind = `${p.osm_value || ''} ${p.name}`;
          const cKey: CatKey = /pharmacy|medical\s*store|chemist|drug/i.test(rawKind)
            ? 'pharmacy'
            : /lab|patholog|chughtai|shaukat|aga\s*khan|diagnostic|blood/i.test(rawKind)
              ? 'lab'
              : /x-?ray|ultrasound|imaging|mri|ct\s*scan|radiolog|clinic/i.test(rawKind)
                ? 'imaging'
                : item.catKey;
          const typeLabel =
            cKey === 'pharmacy'
              ? 'Medical Store / Pharmacy'
              : cKey === 'lab'
                ? 'Blood & Diagnostic Lab'
                : cKey === 'imaging'
                  ? 'X-Ray / Ultrasound / Clinic'
                  : 'Hospital / Emergency';

          collected.push({
            name: p.name.trim(),
            type: typeLabel,
            catKey: cKey,
            distanceKm: dist,
            address: [p.street, p.district, p.city].filter(Boolean).join(', ') || `${dist} km away`,
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${pLat},${pLon}`,
          });
        });
      })
    );
  }

  collected.sort((a, b) => a.distanceKm - b.distanceKm);
  const topPlaces =
    opts.category === 'all'
      ? [
          ...collected.filter((p) => p.catKey === 'hospital').slice(0, 5),
          ...collected.filter((p) => p.catKey === 'pharmacy').slice(0, 5),
          ...collected.filter((p) => p.catKey === 'lab').slice(0, 5),
          ...collected.filter((p) => p.catKey === 'imaging').slice(0, 5),
        ].sort((a, b) => a.distanceKm - b.distanceKm)
      : collected.filter((p) => p.catKey === opts.category).slice(0, 12);

  const areaTail = resolvedArea ? ` near ${resolvedArea}` : ' near me';
  const buildMapUrl = (term: string) =>
    useLat !== null && useLng !== null
      ? `https://www.google.com/maps/search/${encodeURIComponent(term)}/@${useLat},${useLng},14z`
      : `https://www.google.com/maps/search/${encodeURIComponent(term + areaTail)}`;

  const hos0 = topPlaces.find((p) => p.catKey === 'hospital');
  const phm0 = topPlaces.find((p) => p.catKey === 'pharmacy');
  const lab0 = topPlaces.find((p) => p.catKey === 'lab');
  const img0 = topPlaces.find((p) => p.catKey === 'imaging');

  const lines = [
    hos0 ? `🏥 Hospitals: ${hos0.name} (${hos0.distanceKm} km)` : '',
    phm0 ? `💊 Medical Stores: ${phm0.name} (${phm0.distanceKm} km)` : '',
    lab0 ? `🧪 Blood Labs: ${lab0.name} (${lab0.distanceKm} km)` : '',
    img0 ? `🩻 X-Ray / Clinics: ${img0.name} (${img0.distanceKm} km)` : '',
  ].filter(Boolean);

  return {
    places: topPlaces.map(({ name, type, distanceKm, address, mapsUrl }) => ({
      name,
      type,
      distanceKm,
      address,
      mapsUrl,
    })),
    mapSources: [
      { title: '🏥 Hospitals & Emergency Near Me', uri: buildMapUrl('emergency hospital') },
      { title: '💊 24h Medical Stores & Pharmacies', uri: buildMapUrl('24 hour pharmacy medical store') },
      { title: '🧪 Blood Test & Diagnostic Labs', uri: buildMapUrl('diagnostic blood laboratory') },
      { title: '🩻 X-Ray & Ultrasound Centers', uri: buildMapUrl('ultrasound x-ray center') },
    ],
    summary:
      lines.join('\n') ||
      `Live Google Maps links ready near ${resolvedArea || 'your area'} for Hospitals, Medical Stores, Blood Labs & X-Ray Centers.`,
    speakSummary:
      lines.join('. ') ||
      `Google Maps links ready near ${resolvedArea || 'your area'} for Hospitals, Medical Stores, Labs and X-Ray centers.`,
    coords: useLat !== null && useLng !== null ? { lat: useLat, lng: useLng } : null,
  };
}
