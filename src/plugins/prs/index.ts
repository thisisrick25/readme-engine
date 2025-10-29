import type { BasePluginConfig } from '../../types.js';

async function githubImpl(octokit: any, username: string, config: BasePluginConfig) {
    const maxPrs = parseInt(String(config.maxPrs ?? 5), 10);
    const { data: { items } } = await octokit.rest.search.issuesAndPullRequests({
        q: `is:pr is:merged author:${username}`,
        sort: 'updated',
        order: 'desc',
        per_page: maxPrs,
    });

    let prList = '### Recent Pull Requests\n\n';
    if (items.length > 0) {
        prList += items.map((pr: any) => {
            const urlParts = pr.html_url.split('/');
            const owner = urlParts[3];
            const repo = urlParts[4];
            const repoUrl = `https://github.com/${owner}/${repo}`;
            return `- [${pr.title}](${pr.html_url}) ***in [${owner}/${repo}](${repoUrl})***`;
        }).join('\n');
    } else {
        prList += 'No recent merged PRs found.';
    }
    return prList;
}

async function gitlabImpl(gitlab: any, username: string, config: BasePluginConfig) {
    const maxPrs = parseInt(String(config.maxPrs ?? 5), 10);
    const mrs = await gitlab.MergeRequests.all({ author_username: username, state: 'merged', per_page: maxPrs });

    // Fetch project metadata for MRs to get reliable namespace/project values
    // Normalize project IDs to numbers to satisfy TypeScript and Map typing
    const projectIds: number[] = Array.from(new Set(mrs.map((mr: any) => Number(mr.project_id)).filter((id: number) => Number.isFinite(id))));
    const projectCache = new Map<number, any>();
    await Promise.all(projectIds.map(async (id: number) => {
        try {
            const p = await gitlab.Projects.show(id);
            projectCache.set(id, p);
        } catch (e) {
            // ignore failures for individual project lookups
        }
    }));

    let prList = '### Recent Pull Requests\n\n';
    if (mrs.length > 0) {
        prList += mrs.map((mr: any) => {
            const html_url = mr.web_url;
            const project = projectCache.get(Number(mr.project_id));
            const origin = (() => { try { return new URL(html_url).origin } catch { return '' } })();
            let display = '';
            if (project && project.path_with_namespace) {
                display = `${project.path_with_namespace}`;
            } else {
                // Fallback to parsing the URL
                try {
                    const u = new URL(html_url);
                    const parts = u.pathname.split('/').filter(Boolean);
                    display = parts.slice(0, 2).join('/');
                } catch (e) {
                    display = '';
                }
            }
            const repoUrl = display ? `${origin}/${display}` : undefined;
            const repoText = display ? ` in [${display}](${repoUrl})` : '';
            return `- [${mr.title}](${html_url}) ***${repoText}***`;
        }).join('\n');
    } else {
        prList += 'No recent merged MRs found.';
    }
    return prList;
}

export const implementations = {
    github: githubImpl,
    gitlab: gitlabImpl,
};

export default undefined;