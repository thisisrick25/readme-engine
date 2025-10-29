import { Gitlab } from '@gitbeaker/rest';
import * as githubActions from '@actions/github';
import type { Provider } from './types.js';

type GitHubOpts = {
    octokit: ReturnType<typeof githubActions.getOctokit>;
    owner: string;
    repo: string;
    ref?: string;
};

type GitLabOpts = {
    gitlab: InstanceType<typeof Gitlab>;
    projectId: string | number;
    ref?: string;
};

export function createGitHubProvider(opts: GitHubOpts): Provider {
    const { octokit, owner, repo, ref } = opts;

    return {
        providerType: 'github',
        getClient() { return octokit; },

        async getReadmeContent() {
            const readmePath = 'README.md';
            const response = await octokit.rest.repos.getContent({ owner, repo, path: readmePath, ...(ref ? { ref } : {}) });
            const readmeData = response.data as any;
            if (!readmeData || !readmeData.content) throw new Error(`Could not read README content from GitHub repository ${owner}/${repo}.`);
            const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');
            return { content, sha: readmeData.sha };
        },

        async updateReadme(content, commitMessage = 'docs: update README with metrics') {
            const readmePath = 'README.md';
            const current = await octokit.rest.repos.getContent({ owner, repo, path: readmePath, ...(ref ? { ref } : {}) });
            const currentData = current.data as any;
            const sha = currentData.sha;
            await octokit.rest.repos.createOrUpdateFileContents({ owner, repo, path: readmePath, message: commitMessage, content: Buffer.from(content, 'utf-8').toString('base64'), sha });
        },

        async getRepoOwner() {
            return owner;
        }
    };
}

export function createGitLabProvider(opts: GitLabOpts): Provider {
    const { gitlab, projectId, ref } = opts;

    return {
        providerType: 'gitlab',
        getClient() { return gitlab; },

        async getReadmeContent() {
            const filePath = 'README.md';
            const refName = ref || 'main';
            try {
                const file = await gitlab.RepositoryFiles.show(projectId, filePath, refName);
                const content = Buffer.from(file.content, 'base64').toString('utf-8');
                const sha = file.last_commit_id ? String(file.last_commit_id) : undefined;
                return { content, sha };
            } catch (err: any) {
                // If the README doesn't exist, return an empty content so plugins can create it.
                const status = err?.response?.status || err?.status;
                if (status === 404 || /not found/i.test(String(err?.message || ''))) {
                    return { content: '', sha: undefined };
                }
                // Try to get a human-friendly namespace/project for the error message
                try {
                    const project = await gitlab.Projects.show(projectId);
                    const ns = String(project.path_with_namespace || projectId);
                    throw new Error(`Could not read README content from GitLab repository ${ns}.`);
                } catch (innerErr) {
                    // Fallback to projectId if fetching project info fails
                    throw new Error(`Could not read README content from GitLab repository ${projectId}.`);
                }
            }
        },

        async updateReadme(content, commitMessage = 'docs: update README with metrics') {
            const filePath = 'README.md';
            const refName = ref || 'main';
            try {
                await gitlab.RepositoryFiles.edit(projectId, filePath, refName, content, commitMessage);
            } catch (err: any) {
                await gitlab.RepositoryFiles.create(projectId, filePath, refName, content, commitMessage);
            }
        },

        async getRepoOwner() {
            const project = await gitlab.Projects.show(projectId);
            const ns = String(project.path_with_namespace || '');
            const owner = ns.split('/')[0] || '';
            return owner;
        }
    };
}
