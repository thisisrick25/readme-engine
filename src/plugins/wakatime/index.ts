import type { Plugin } from '../../types.js';

// --- Stats resource shapes (stats/:range) -------------------------------

interface WakaTimeStatItem {
    name: string;
    percent: number;
    text: string;
}

interface WakaTimeStatsData {
    human_readable_total?: string;
    human_readable_daily_average?: string;
    languages?: WakaTimeStatItem[];
    editors?: WakaTimeStatItem[];
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

// --- Insights resource shapes (insights/:type/last_year) ----------------
// Insight items have NO percent/text; only name + seconds + AI/manual split.

interface WakaTimeInsightItem {
    name: string;
    total_seconds: number;
}

interface WakaTimeInsightData {
    languages?: WakaTimeInsightItem[];
    editors?: WakaTimeInsightItem[];
    human_readable_range?: string;
}

interface WakaTimeInsightResponse {
    data?: WakaTimeInsightData;
}

const BAR_LENGTH = 20;
const BASE_URL = 'https://wakatime.com/api/v1/users/current';

type SectionKey =
    | 'last30Total'
    | 'last30Languages'
    | 'last30Editors'
    | 'allTimeTotal'
    | 'allTimeLanguages'
    | 'allTimeEditors'
    | 'sinceToday'
    | 'insightsLanguages'
    | 'insightsEditors';
const VALID_SECTIONS: readonly SectionKey[] = [
    'last30Total',
    'last30Languages',
    'last30Editors',
    'allTimeTotal',
    'allTimeLanguages',
    'allTimeEditors',
    'sinceToday',
    'insightsLanguages',
    'insightsEditors',
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

// Turn a raw second count into a compact "Xh Ym" human string, since the
// insights endpoint (unlike stats) does not provide a human-readable text field.
function humanizeSeconds(totalSeconds: number): string {
    const totalMinutes = Math.round(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

async function fetchJson<T>(path: string, authHeader: string): Promise<T | null> {
    try {
        const response = await fetch(`${BASE_URL}${path}`, {
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

// Renders top-N items that already carry percent + text (stats resource).
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
        return `${name}  ${bar}  ${percent}  ${item.text}`;
    });
    return `\`\`\`text\n${lines.join('\n')}\n\`\`\`\n`;
}

// Renders top-N insight items, computing percent from the summed seconds
// because insight items expose only name + total_seconds.
function renderInsightItems(items: WakaTimeInsightItem[], topN: number): string {
    if (items.length === 0) {
        return '';
    }
    const totalSeconds = items.reduce((sum, item) => sum + item.total_seconds, 0);
    if (totalSeconds <= 0) {
        return '';
    }
    const top = items.slice(0, topN);
    const maxNameLength = Math.max(...top.map(item => item.name.length));
    const lines = top.map(item => {
        const percentValue = (item.total_seconds / totalSeconds) * 100;
        const name = item.name.padEnd(maxNameLength, ' ');
        const bar = makeBar(percentValue);
        const percent = `${percentValue.toFixed(1)}%`.padStart(6, ' ');
        return `${name}  ${bar}  ${percent}  ${humanizeSeconds(item.total_seconds)}`;
    });
    return `\`\`\`text\n${lines.join('\n')}\n\`\`\`\n`;
}

async function renderLast30Total(fetchEndpoint: EndpointFetch): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeStatsResponse>('/stats/last_30_days'))?.data;
    if (!data) {
        return '';
    }
    const summary: string[] = [];
    if (data.human_readable_total) {
        summary.push(`**Total:** ${data.human_readable_total}`);
    }
    if (data.human_readable_daily_average) {
        summary.push(`**Daily average:** ${data.human_readable_daily_average}`);
    }
    return summary.length > 0 ? `#### Last 30 Days\n\n${summary.join(' • ')}` : '';
}

async function renderLast30Languages(fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeStatsResponse>('/stats/last_30_days'))?.data;
    const block = renderStatItems(data?.languages ?? [], topN);
    return block ? `#### Last 30 Days — Languages\n\n${block}` : '';
}

async function renderLast30Editors(fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeStatsResponse>('/stats/last_30_days'))?.data;
    const block = renderStatItems(data?.editors ?? [], topN);
    return block ? `#### Last 30 Days — Editors\n\n${block}` : '';
}

async function renderAllTimeTotal(fetchEndpoint: EndpointFetch): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeStatsResponse>('/stats/all_time'))?.data;
    if (!data?.human_readable_total) {
        return '';
    }
    return `#### All Time\n\n**Total:** ${data.human_readable_total}`;
}

async function renderAllTimeLanguages(fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeStatsResponse>('/stats/all_time'))?.data;
    const block = renderStatItems(data?.languages ?? [], topN);
    return block ? `#### All Time — Languages\n\n${block}` : '';
}

async function renderAllTimeEditors(fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeStatsResponse>('/stats/all_time'))?.data;
    const block = renderStatItems(data?.editors ?? [], topN);
    return block ? `#### All Time — Editors\n\n${block}` : '';
}

async function renderSinceToday(fetchEndpoint: EndpointFetch): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeAllTimeResponse>('/all_time_since_today'))?.data;
    if (!data?.text) {
        return '';
    }
    const since = data.range?.start_text ? ` (since ${data.range.start_text})` : '';
    return `**All-Time Total:** ${data.text}${since}`;
}

async function renderInsightsLanguages(fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeInsightResponse>('/insights/languages/last_year'))?.data;
    const block = renderInsightItems(data?.languages ?? [], topN);
    return block ? `#### Last Year Languages\n\n${block}` : '';
}

async function renderInsightsEditors(fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    const data = (await fetchEndpoint<WakaTimeInsightResponse>('/insights/editors/last_year'))?.data;
    const block = renderInsightItems(data?.editors ?? [], topN);
    return block ? `#### Last Year Editors\n\n${block}` : '';
}

async function renderSection(key: SectionKey, fetchEndpoint: EndpointFetch, topN: number): Promise<string> {
    switch (key) {
        case 'last30Total':
            return renderLast30Total(fetchEndpoint);
        case 'last30Languages':
            return renderLast30Languages(fetchEndpoint, topN);
        case 'last30Editors':
            return renderLast30Editors(fetchEndpoint, topN);
        case 'allTimeTotal':
            return renderAllTimeTotal(fetchEndpoint);
        case 'allTimeLanguages':
            return renderAllTimeLanguages(fetchEndpoint, topN);
        case 'allTimeEditors':
            return renderAllTimeEditors(fetchEndpoint, topN);
        case 'sinceToday':
            return renderSinceToday(fetchEndpoint);
        case 'insightsLanguages':
            return renderInsightsLanguages(fetchEndpoint, topN);
        case 'insightsEditors':
            return renderInsightsEditors(fetchEndpoint, topN);
    }
}

const wakatimePlugin: Plugin = async (_octokit, _username, config) => {
    const heading = '### WakaTime\n\n';

    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) {
        return `${heading}WakaTime stats are unavailable because the \`WAKATIME_API_KEY\` secret is not set.`;
    }

    const topN = parseInt(String((config as { maxPrs?: number }).maxPrs ?? 5), 10);
    const authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`;
    const selected = parseSections(config);
    const fetchEndpoint = createEndpointCache(authHeader);

    try {
        const rendered = await Promise.all(
            selected.map(key => renderSection(key, fetchEndpoint, topN)),
        );
        const sections = rendered.filter(Boolean);

        if (sections.length === 0) {
            return `${heading}No WakaTime data available yet.`;
        }

        return `${heading}${sections.join('\n\n').trimEnd()}`;
    } catch (error) {
        console.error('Error fetching WakaTime stats:', error);
        return `${heading}An error occurred while fetching WakaTime stats.`;
    }
};

export default wakatimePlugin;
