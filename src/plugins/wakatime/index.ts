import type { Plugin, PluginSections } from '../../types.js';

// --- Stats resource shapes (stats/:range) -------------------------------
// Stat items carry percent + text, plus AI/manual second counts as strings.

interface WakaTimeStatItem {
    name: string;
    percent: number;
    text: string;
    ai_coding_seconds?: string;
    manual_coding_seconds?: string;
}

interface WakaTimeBestDay {
    date?: string;
    text?: string;
}

interface WakaTimeStatsData {
    human_readable_total?: string;
    human_readable_daily_average?: string;
    languages?: WakaTimeStatItem[];
    editors?: WakaTimeStatItem[];
    categories?: WakaTimeStatItem[];
    best_day?: WakaTimeBestDay;
}

interface WakaTimeStatsResponse {
    data?: WakaTimeStatsData;
}

// --- All-time-since-today shape (total only) ----------------------------

interface WakaTimeAllTimeData {
    text?: string;
    range?: { start_text?: string };
}

interface WakaTimeAllTimeResponse {
    data?: WakaTimeAllTimeData;
}

// --- Standalone endpoint shapes (distinct from stats/:range) -------------

interface WakaTimeGrandTotal {
    text?: string;
    total_seconds?: number;
}

interface WakaTimeSummariesDay {
    grand_total?: WakaTimeGrandTotal;
    range?: { date?: string };
}

interface WakaTimeCumulativeTotal {
    text?: string;
}

interface WakaTimeSummariesResponse {
    data?: WakaTimeSummariesDay[];
    cumulative_total?: WakaTimeCumulativeTotal;
}

interface WakaTimeStatusBarResponse {
    data?: { grand_total?: WakaTimeGrandTotal };
}

interface WakaTimeProject {
    name?: string;
}

interface WakaTimeProjectsResponse {
    data?: WakaTimeProject[];
    total?: number;
}

interface WakaTimeGoalsResponse {
    total?: number;
}

interface WakaTimeLeadersResponse {
    current_user?: { rank?: number };
}

interface WakaTimeDurationsResponse {
    data?: { duration?: number }[];
}

const BAR_LENGTH = 20;
const BASE_URL = 'https://wakatime.com/api/v1/users/current';

// --- Time windows -------------------------------------------------------
// Each window maps to a free-tier stats/:range endpoint plus display labels.

type WindowKey = 'last7' | 'last30' | 'allTime' | 'lastYear';

interface WindowSpec {
    path: string;
    label: string;
}

const WINDOWS: Record<WindowKey, WindowSpec> = {
    last7: { path: '/stats/last_7_days', label: 'Last 7 Days' },
    last30: { path: '/stats/last_30_days', label: 'Last 30 Days' },
    allTime: { path: '/stats/all_time', label: 'All Time' },
    lastYear: { path: '/stats/last_year', label: 'Last Year' },
};

type Facet = 'Total' | 'Languages' | 'Editors' | 'Categories' | 'BestDay';

const FACETS: readonly Facet[] = ['Total', 'Languages', 'Editors', 'Categories', 'BestDay'];
const WINDOW_KEYS: readonly WindowKey[] = ['last7', 'last30', 'allTime', 'lastYear'];

type StandaloneKey = 'sinceToday' | 'summaries' | 'today' | 'projects' | 'leaders' | 'goals' | 'durations';

type SectionKey = `${WindowKey}${Facet}` | StandaloneKey;

const STANDALONE_KEYS: readonly StandaloneKey[] = [
    'sinceToday',
    'summaries',
    'today',
    'projects',
    'leaders',
    'goals',
    'durations',
];

const VALID_SECTIONS: readonly SectionKey[] = [
    ...WINDOW_KEYS.flatMap(w => FACETS.map(f => `${w}${f}` as SectionKey)),
    ...STANDALONE_KEYS,
];
const DEFAULT_SECTIONS: readonly SectionKey[] = ['last30Languages'];

function parseSections(config: unknown): SectionKey[] {
    const raw = (config as { sections?: unknown }).sections;
    if (!Array.isArray(raw)) {
        return [...DEFAULT_SECTIONS];
    }
    const seen = new Set<SectionKey>();
    for (const entry of raw) {
        if (typeof entry === 'string' && (VALID_SECTIONS as readonly string[]).includes(entry)) {
            seen.add(entry as SectionKey);
        }
    }
    return seen.size > 0 ? [...seen] : [...DEFAULT_SECTIONS];
}

function makeBar(percent: number): string {
    const filled = Math.round((percent / 100) * BAR_LENGTH);
    const safeFilled = Math.max(0, Math.min(BAR_LENGTH, filled));
    return '█'.repeat(safeFilled) + '░'.repeat(BAR_LENGTH - safeFilled);
}

// AI/manual second counts arrive as strings; produce a compact "AI 62% · Manual 38%"
// annotation, returning '' when the split is unavailable or empty.
function aiManualAnnotation(item: WakaTimeStatItem): string {
    const ai = Number(item.ai_coding_seconds);
    const manual = Number(item.manual_coding_seconds);
    if (!Number.isFinite(ai) || !Number.isFinite(manual)) {
        return '';
    }
    const total = ai + manual;
    if (total <= 0) {
        return '';
    }
    const aiPct = Math.round((ai / total) * 100);
    return ` [AI ${aiPct}% · Manual ${100 - aiPct}%]`;
}

async function fetchJson<T>(path: string, authHeader: string): Promise<T | null> {
    try {
        const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
        const response = await fetch(url, {
            headers: { Authorization: authHeader },
        });
        if (!response.ok) {
            return null;
        }
        return (await response.json()) as T;
    } catch (error) {
        console.error(`Error fetching WakaTime endpoint ${path}:`, error);
        return null;
    }
}

// Granular section keys can share an endpoint (e.g. last30Total/Languages/Editors
// all read /stats/last_30_days), so memoize each path per run to fetch it once.
function createEndpointCache(authHeader: string): <T>(path: string) => Promise<T | null> {
    const cache = new Map<string, Promise<unknown>>();
    return <T>(path: string): Promise<T | null> => {
        const existing = cache.get(path);
        if (existing) {
            return existing as Promise<T | null>;
        }
        const pending = fetchJson<T>(path, authHeader);
        cache.set(path, pending);
        return pending;
    };
}

type EndpointFetch = <T>(path: string) => Promise<T | null>;

// Renders top-N items that carry percent + text, annotating each with its
// AI/manual coding split when available.
function renderStatItems(items: WakaTimeStatItem[], topN: number): string {
    const top = items.slice(0, topN);
    if (top.length === 0) {
        return '';
    }
    const maxNameLength = Math.max(...top.map(item => item.name.length));
    const lines = top.map(item => {
        const name = item.name.padEnd(maxNameLength, ' ');
        const bar = makeBar(item.percent);
        const percent = `${item.percent.toFixed(1)}%`.padStart(6, ' ');
        return `${name}  ${bar}  ${percent}  ${item.text}${aiManualAnnotation(item)}`;
    });
    return `<pre>\n${lines.join('\n')}\n</pre>`;
}

async function fetchWindow(
    window: WindowKey,
    fetchEndpoint: EndpointFetch,
): Promise<WakaTimeStatsData | undefined> {
    return (await fetchEndpoint<WakaTimeStatsResponse>(WINDOWS[window].path))?.data;
}

async function renderTotal(window: WindowKey, fetchEndpoint: EndpointFetch): Promise<string> {
    const data = await fetchWindow(window, fetchEndpoint);
    if (!data) {
        return '';
    }
    const summary: string[] = [];
    if (data.human_readable_total) {
        summary.push(`${data.human_readable_total} total`);
    }
    if (data.human_readable_daily_average) {
        summary.push(`${data.human_readable_daily_average}/day`);
    }
    return summary.length > 0 ? `**${WINDOWS[window].label}:** ${summary.join(' • ')}` : '';
}

async function renderLanguages(window: WindowKey, fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const data = await fetchWindow(window, fetchEndpoint);
    const block = renderStatItems(data?.languages ?? [], topN);
    return block ? `#### ${WINDOWS[window].label} — Languages\n\n${block}` : '';
}

async function renderEditors(window: WindowKey, fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const data = await fetchWindow(window, fetchEndpoint);
    const block = renderStatItems(data?.editors ?? [], topN);
    return block ? `#### ${WINDOWS[window].label} — Editors\n\n${block}` : '';
}

async function renderCategories(window: WindowKey, fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const data = await fetchWindow(window, fetchEndpoint);
    const block = renderStatItems(data?.categories ?? [], topN);
    return block ? `#### ${WINDOWS[window].label} — Categories\n\n${block}` : '';
}

async function renderBestDay(window: WindowKey, fetchEndpoint: EndpointFetch): Promise<string> {
    const best = (await fetchWindow(window, fetchEndpoint))?.best_day;
    if (!best?.text) {
        return '';
    }
    const date = best.date ? ` on ${best.date}` : '';
    return `**${WINDOWS[window].label} Best Day:** ${best.text}${date}`;
}

async function renderSinceToday(fetchEndpoint: EndpointFetch): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeAllTimeResponse>('/all_time_since_today'))?.data;
    if (!data?.text) {
        return '';
    }
    const since = data.range?.start_text ? ` (since ${data.range.start_text})` : '';
    return `**All-Time Total:** ${data.text}${since}`;
}

function isoDate(offsetDays: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

async function renderSummaries(fetchEndpoint: EndpointFetch): Promise<string> {
    const response = await fetchEndpoint<WakaTimeSummariesResponse>(
        `/summaries?start=${isoDate(-6)}&end=${isoDate(0)}`,
    );
    const days = response?.data ?? [];
    if (days.length === 0) {
        return '';
    }
    const maxSeconds = Math.max(...days.map(day => day.grand_total?.total_seconds ?? 0), 0);
    const lines = days.map(day => {
        const seconds = day.grand_total?.total_seconds ?? 0;
        const percent = maxSeconds > 0 ? (seconds / maxSeconds) * 100 : 0;
        const label = (day.range?.date ?? '').padEnd(10, ' ');
        const text = day.grand_total?.text ?? '0 secs';
        return `${label}  ${makeBar(percent)}  ${text}`;
    });
    const total = response?.cumulative_total?.text;
    const heading = total
        ? `#### Last 7 Days — Activity\n\n**Total:** ${total}`
        : '#### Last 7 Days — Activity';
    return `${heading}\n\n<pre>\n${lines.join('\n')}\n</pre>`;
}

async function renderToday(fetchEndpoint: EndpointFetch): Promise<string> {
    const total = (await fetchEndpoint<WakaTimeStatusBarResponse>('/status_bar/today'))?.data?.grand_total;
    if (!total?.text) {
        return '';
    }
    return `**Today:** ${total.text}`;
}

async function renderProjects(fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const response = await fetchEndpoint<WakaTimeProjectsResponse>('/projects');
    const names = (response?.data ?? [])
        .map(project => project.name)
        .filter((name): name is string => Boolean(name))
        .slice(0, topN);
    if (names.length === 0) {
        return '';
    }
    const list = names.map(name => `- ${name}`).join('\n');
    return `#### Recent Projects\n\n${list}`;
}

async function renderLeaders(fetchEndpoint: EndpointFetch): Promise<string> {
    const rank = (await fetchEndpoint<WakaTimeLeadersResponse>('https://wakatime.com/api/v1/leaders'))?.current_user?.rank;
    if (typeof rank !== 'number') {
        return '';
    }
    return `**Global Rank:** #${rank.toLocaleString('en-US')}`;
}

async function renderGoals(fetchEndpoint: EndpointFetch): Promise<string> {
    const total = (await fetchEndpoint<WakaTimeGoalsResponse>('/goals'))?.total;
    if (!total || total <= 0) {
        return '';
    }
    return `**Active Goals:** ${total}`;
}

async function renderDurations(fetchEndpoint: EndpointFetch): Promise<string> {
    const blocks = (await fetchEndpoint<WakaTimeDurationsResponse>(`/durations?date=${isoDate(0)}`))?.data ?? [];
    if (blocks.length === 0) {
        return '';
    }
    const seconds = blocks.reduce((sum, block) => sum + (block.duration ?? 0), 0);
    const minutes = Math.round(seconds / 60);
    const label = minutes >= 60 ? `${Math.floor(minutes / 60)} hrs ${minutes % 60} mins` : `${minutes} mins`;
    return `**Today's Sessions:** ${blocks.length} (${label})`;
}

function renderStandalone(key: StandaloneKey, fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    switch (key) {
        case 'sinceToday':
            return renderSinceToday(fetchEndpoint);
        case 'summaries':
            return renderSummaries(fetchEndpoint);
        case 'today':
            return renderToday(fetchEndpoint);
        case 'projects':
            return renderProjects(fetchEndpoint, topN);
        case 'leaders':
            return renderLeaders(fetchEndpoint);
        case 'goals':
            return renderGoals(fetchEndpoint);
        case 'durations':
            return renderDurations(fetchEndpoint);
    }
}

function renderFacet(
    window: WindowKey,
    facet: Facet,
    fetchEndpoint: EndpointFetch,
    topN: number,
): Promise<string> {
    switch (facet) {
        case 'Total':
            return renderTotal(window, fetchEndpoint);
        case 'Languages':
            return renderLanguages(window, fetchEndpoint, topN);
        case 'Editors':
            return renderEditors(window, fetchEndpoint, topN);
        case 'Categories':
            return renderCategories(window, fetchEndpoint, topN);
        case 'BestDay':
            return renderBestDay(window, fetchEndpoint);
    }
}

async function renderSection(key: SectionKey, fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    if ((STANDALONE_KEYS as readonly string[]).includes(key)) {
        return renderStandalone(key as StandaloneKey, fetchEndpoint, topN);
    }
    for (const window of WINDOW_KEYS) {
        for (const facet of FACETS) {
            if (key === `${window}${facet}`) {
                return renderFacet(window, facet, fetchEndpoint, topN);
            }
        }
    }
    return '';
}

const wakatimePlugin: Plugin = async (_octokit, _username, config) => {
    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) {
        return { '': '### WakaTime\n\nWakaTime stats are unavailable because the `WAKATIME_API_KEY` secret is not set.' };
    }

    const topN = parseInt(String((config as { maxPrs?: number }).maxPrs ?? 5), 10);
    const authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`;
    const selected = parseSections(config);
    const fetchEndpoint = createEndpointCache(authHeader);

    try {
        const rendered = await Promise.all(
            selected.map(key => renderSection(key, fetchEndpoint, topN)),
        );
        const output: PluginSections = {};
        selected.forEach((key, index) => {
            const content = rendered[index];
            if (content) {
                output[key.toUpperCase()] = content;
            }
        });
        return output;
    } catch (error) {
        console.error('Error fetching WakaTime stats:', error);
        return { '': '### WakaTime\n\nAn error occurred while fetching WakaTime stats.' };
    }
};

export default wakatimePlugin;
