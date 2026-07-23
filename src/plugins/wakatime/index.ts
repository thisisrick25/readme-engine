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

const wakatimePlugin: Plugin = async (_octokit, _username, config) => {
    const heading = '### WakaTime\n\n';

    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) {
        return `${heading}WakaTime stats are unavailable because the \`WAKATIME_API_KEY\` secret is not set.`;
    }

    const topN = parseInt(String((config as { maxPrs?: number }).maxPrs ?? 5), 10);
    const authHeader = `Basic ${Buffer.from(apiKey).toString('base64')}`;

    try {
        // Fetch every free-tier endpoint in parallel; each resolves to null on failure
        // so one paid/errored endpoint never blocks the rest of the block.
        const [last30, allTime, sinceToday, insightLangs, insightEditors] = await Promise.all([
            fetchJson<WakaTimeStatsResponse>('/stats/last_30_days', authHeader),
            fetchJson<WakaTimeStatsResponse>('/stats/all_time', authHeader),
            fetchJson<WakaTimeAllTimeResponse>('/all_time_since_today', authHeader),
            fetchJson<WakaTimeInsightResponse>('/insights/languages/last_year', authHeader),
            fetchJson<WakaTimeInsightResponse>('/insights/editors/last_year', authHeader),
        ]);

        const sections: string[] = [];

        // Lifetime total line (all_time_since_today) — a single headline number.
        const sinceData = sinceToday?.data;
        if (sinceData?.text) {
            const since = sinceData.range?.start_text
                ? ` (since ${sinceData.range.start_text})`
                : '';
            sections.push(`**All-Time Total:** ${sinceData.text}${since}`);
        }

        // Last 30 days (stats) — total + daily average summary, then breakdowns.
        const last30Data = last30?.data;
        if (last30Data) {
            const summary: string[] = [];
            if (last30Data.human_readable_total) {
                summary.push(`**Total:** ${last30Data.human_readable_total}`);
            }
            if (last30Data.human_readable_daily_average) {
                summary.push(`**Daily average:** ${last30Data.human_readable_daily_average}`);
            }
            const langs = renderStatItems(last30Data.languages ?? [], topN);
            const editors = renderStatItems(last30Data.editors ?? [], topN);
            const block = [
                summary.length > 0 ? summary.join(' • ') : '',
                langs ? `_Languages_\n\n${langs}` : '',
                editors ? `_Editors_\n\n${editors}` : '',
            ].filter(Boolean).join('\n\n');
            if (block) {
                sections.push(`#### Last 30 Days\n\n${block}`);
            }
        }

        // All time (stats) — lifetime language/editor breakdown with percent.
        const allTimeData = allTime?.data;
        if (allTimeData) {
            const summary = allTimeData.human_readable_total
                ? `**Total:** ${allTimeData.human_readable_total}`
                : '';
            const langs = renderStatItems(allTimeData.languages ?? [], topN);
            const editors = renderStatItems(allTimeData.editors ?? [], topN);
            const block = [
                summary,
                langs ? `_Languages_\n\n${langs}` : '',
                editors ? `_Editors_\n\n${editors}` : '',
            ].filter(Boolean).join('\n\n');
            if (block) {
                sections.push(`#### All Time\n\n${block}`);
            }
        }

        // Last year insights — rolling 1-year breakdown (percent computed from seconds).
        const insightLangItems = insightLangs?.data?.languages ?? [];
        const insightEditorItems = insightEditors?.data?.editors ?? [];
        const insightLangBlock = renderInsightItems(insightLangItems, topN);
        const insightEditorBlock = renderInsightItems(insightEditorItems, topN);
        if (insightLangBlock || insightEditorBlock) {
            const block = [
                insightLangBlock ? `_Languages_\n\n${insightLangBlock}` : '',
                insightEditorBlock ? `_Editors_\n\n${insightEditorBlock}` : '',
            ].filter(Boolean).join('\n\n');
            sections.push(`#### Last Year Insights\n\n${block}`);
        }

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
