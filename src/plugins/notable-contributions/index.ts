import type { Plugin } from '../../types.js';

const notableContributionsPlugin: Plugin = async (octokit, username, config) => {
    const maxPrs = parseInt(String(config.maxPrs ?? 5), 10); // Default to 5 if not provided

    const { data: { items: pullRequests } } = await octokit.rest.search.issuesAndPullRequests({
        q: `is:pr is:merged author:${username} -user:${username}`,
        sort: 'updated',
        order: 'desc',
        per_page: maxPrs,
    });

    let prList = '### Notable Contributions\n\n';

    if (pullRequests.length > 0) {
        prList += pullRequests.map(pr => {
            const urlParts = pr.html_url.split('/');
            const owner = urlParts[3];
            const repo = urlParts[4];
            const repoUrl = `https://github.com/${owner}/${repo}`;
            return `- [${pr.title}](${pr.html_url}) ***in [${owner}/${repo}](${repoUrl})***`;
        }).join('\n');
    } else {
        prList += 'No notable contributions found.';
    }

    return prList;
}

export default notableContributionsPlugin;