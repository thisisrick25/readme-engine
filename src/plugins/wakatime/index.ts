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

type SectionKey = 'last30' | 'allTime' | 'sinceToday' | 'insights';
const VALID_SECTIONS: readonly SectionKey[] = ['last30', 'allTime', 'sinceToday', 'insights'];
const DEFAULT_SECTIONS: readonly SectionKey[] = ['last30'];

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

async function renderLast30(authHeader: string, topN: number): Promise<string> {
    const response = await fetchJson<WakaTimeStatsResponse>('/stats/last_30_days', authHeader);
    const data = response?.data;
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
    const langs = renderStatItems(data.languages ?? [], topN);
    const editors = renderStatItems(data.editors ?? [], topN);
    const block = [
        summary.length > 0 ? summary.join(' • ') : '',
        langs ? `_Languages_\n\n${langs}` : '',
        editors ? `_Editors_\n\n${editors}` : '',
    ].filter(Boolean).join('\n\n');
    return block ? `#### Last 30 Days\n\n${block}` : '';
}

async function renderAllTime(authHeader: string, topN: number): Promise<string> {
    const response = await fetchJson<WakaTimeStatsResponse>('/stats/all_time', authHeader);
    const data = response?.data;
    if (!data) {
        return '';
    }
    const summary = data.human_readable_total ? `**Total:** ${data.human_readable_total}` : '';
    const langs = renderStatItems(data.languages ?? [], topN);
    const editors = renderStatItems(data.editors ?? [], topN);
    const block = [
        summary,
        langs ? `_Languages_\n\n${langs}` : '',
        editors ? `_Editors_\n\n${editors}` : '',
    ].filter(Boolean).join('\n\n');
    return block ? `#### All Time\n\n${block}` : '';
}

async function renderSinceToday(authHeader: string): Promise<string> {
    const response = await fetchJson<WakaTimeAllTimeResponse>('/all_time_since_today', authHeader);
    const data = response?.data;
    if (!data?.text) {
        return '';
    }
    const since = data.range?.start_text ? ` (since ${data.range.start_text})` : '';
    return `**All-Time Total:** ${data.text}${since}`;
}

async function renderInsights(authHeader: string, topN: number): Promise<string> {
    const [langsResponse, editorsResponse] = await Promise.all([
        fetchJson<WakaTimeInsightResponse>('/insights/languages/last_year', authHeader),
        fetchJson<WakaTimeInsightResponse>('/insights/editors/last_year', authHeader),
    ]);
    const langBlock = renderInsightItems(langsResponse?.data?.languages ?? [], topN);
    const editorBlock = renderInsightItems(editorsResponse?.data?.editors ?? [], topN);
    if (!langBlock && !editorBlock) {
        return '';
    }
    const block = [
        langBlock ? `_Languages_\n\n${langBlock}` : '',
        editorBlock ? `_Editors_\n\n${editorBlock}` : '',
    ].filter(Boolean).join('\n\n');
    return `#### Last Year Insights\n\n${block}`;
}

async function renderSection(key: SectionKey, authHeader: string, topN: number): Promise<string> {
    switch (key) {
        case 'last30':
            return renderLast30(authHeader, topN);
        case 'allTime':
            return renderAllTime(authHeader, topN);
        case 'sinceToday':
            return renderSinceToday(authHeader);
        case 'insights':
            return renderInsights(authHeader, topN);
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

    try {
        const rendered = await Promise.all(
            selected.map(key => renderSection(key, authHeader, topN)),
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
