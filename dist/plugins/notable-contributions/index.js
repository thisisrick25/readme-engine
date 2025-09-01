module.exports = async function(octokit, username, maxPrs) {
    const { data: { items: pullRequests } } = await octokit.rest.search.issuesAndPullRequests({
        q: `is:pr is:merged author:${username} -user:${username}`,
        sort: 'updated',
        order: 'desc',
        per_page: maxPrs,
    });

    let prList = pullRequests.map(pr => `- [${pr.title}](${pr.html_url})`).join('\n');

    if (!prList) {
        prList = 'No notable contributions found.';
    }

    return prList;
}