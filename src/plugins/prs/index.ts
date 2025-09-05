import type { Plugin } from '../../types.js';

const prsPlugin: Plugin = async (octokit, username, config) => {
    const maxPrs = parseInt(String(config.maxPrs ?? 5), 10); // Default to 5 if not provided
    
    const { data: { items: pullRequests } } = await octokit.rest.search.issuesAndPullRequests({
        q: `is:pr is:merged author:${username}`,
        sort: 'updated',
        order: 'desc',
        per_page: maxPrs,
    });

    let prList = pullRequests.map(pr => `- [${pr.title}](${pr.html_url})`).join('\n');

    if (!prList) {
        prList = 'No recent merged PRs found.';
    }

    return prList;
}

export default prsPlugin;