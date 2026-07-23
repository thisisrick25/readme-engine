import type { Plugin } from '../../types.js';

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

const BAR_LENGTH = 20;

function makeBar(percent: number): string {
    const filled = Math.round((percent / 100) * BAR_LENGTH);
    const safeFilled = Math.max(0, Math.min(BAR_LENGTH, filled));
    return '█'.repeat(safeFilled) + '░'.repeat(BAR_LENGTH - safeFilled);
}

function renderSection(title: string, items: WakaTimeStatItem[], topN: number): string {
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
    return `**${title}**\n\n\`\`\`text\n${lines.join('\n')}\n\`\`\`\n`;
}

const wakatimePlugin: Plugin = async (_octokit, _username, config) => {
    const heading = '### WakaTime (Last 30 Days)\n\n';

    const apiKey = process.env.WAKATIME_API_KEY;
    if (!apiKey) {
        return `${heading}WakaTime stats are unavailable because the \`WAKATIME_API_KEY\` secret is not set.`;
    }

    const topN = parseInt(String((config as { maxPrs?: number }).maxPrs ?? 5), 10);

    try {
        const encodedKey = Buffer.from(apiKey).toString('base64');
        const response = await fetch(
            'https://wakatime.com/api/v1/users/current/stats/last_30_days',
            {
                headers: {
                    Authorization: `Basic ${encodedKey}`,
                },
            }
        );

        if (!response.ok) {
            return `${heading}Could not fetch WakaTime stats (HTTP ${response.status}).`;
        }

        const payload = (await response.json()) as WakaTimeStatsResponse;
        const data = payload.data;

        if (!data) {
            return `${heading}No WakaTime data available yet.`;
        }

        const parts: string[] = [];

        if (data.human_readable_total) {
            parts.push(`**Total:** ${data.human_readable_total}`);
        }
        if (data.human_readable_daily_average) {
            parts.push(`**Daily average:** ${data.human_readable_daily_average}`);
        }

        let body = parts.length > 0 ? `${parts.join(' • ')}\n\n` : '';

        const languagesSection = renderSection('Languages', data.languages ?? [], topN);
        const editorsSection = renderSection('Editors', data.editors ?? [], topN);

        body += [languagesSection, editorsSection].filter(Boolean).join('\n');

        if (!body.trim()) {
            return `${heading}No WakaTime activity recorded in the last 30 days.`;
        }

        return `${heading}${body.trimEnd()}`;
    } catch (error) {
        console.error('Error fetching WakaTime stats:', error);
        return `${heading}An error occurred while fetching WakaTime stats.`;
    }
};

export default wakatimePlugin;
