module.exports = async function(octokit, username, prsConfig) {
    const maxPrs = prsConfig && prsConfig.maxPrs ? parseInt(prsConfig.maxPrs, 10) : 5; // Default to 5 if not provided
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