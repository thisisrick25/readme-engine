import * as core from '@actions/core';
import * as github from '@actions/github';
import { promises as fs } from 'fs';
import runCore from './core.js';
import { createGitHubProvider, createGitLabProvider } from './providers.js';

import type { PluginsConfig } from './types.js';

async function run(): Promise<string> {
  let newReadmeContent: string = "";
  let readmeContent: string;
  let readmeSha: string | undefined; // To store SHA for remote update, might not exist in local mode
  try {
    const githubToken = core.getInput('GITHUB_TOKEN');
    const plugins = core.getInput('PLUGINS').split(',').map(p => p.trim());
    const pluginConfigString = core.getInput('PLUGIN_CONFIG');
    const pluginConfig: PluginsConfig = JSON.parse(pluginConfigString || '{}');
    console.log(pluginConfig);

    const providerInput = core.getInput('PROVIDER') || process.env.PROVIDER || (process.env.GITLAB_CI === 'true' ? 'gitlab' : 'github');

    // Create provider abstraction
    let provider: any;
    if (providerInput === 'gitlab') {
      const gitlabToken = core.getInput('GITLAB_TOKEN') || process.env.CI_JOB_TOKEN;
      if (!gitlabToken) throw new Error('GITLAB_TOKEN or CI_JOB_TOKEN must be provided for GitLab mode.');
      const { Gitlab } = await import('@gitbeaker/rest');
      const gitlabHost = process.env.CI_API_V4_URL?.replace(/\/api\/v4\/?$/, '') || 'https://gitlab.com';
      const gitlab = new Gitlab({ host: gitlabHost, token: gitlabToken });
      const projectId = core.getInput('GITLAB_PROJECT_ID') || process.env.CI_PROJECT_ID;
      if (!projectId) throw new Error('GITLAB_PROJECT_ID or CI_PROJECT_ID must be provided for GitLab mode.');
      provider = createGitLabProvider({ gitlab, projectId, ref: process.env.CI_COMMIT_REF_NAME });
    } else {
      const octokit = github.getOctokit(githubToken);
      const owner = process.env.LOCAL_TEST_MODE === 'true' ? process.env.GITHUB_USERNAME : github.context.repo.owner;
      const repo = process.env.LOCAL_TEST_MODE === 'true' ? process.env.LOCAL_REPO_NAME || '' : github.context.repo.repo;
      provider = createGitHubProvider({ octokit, owner, repo, ref: github.context.ref });
    }

    // Determine source of README content based on mode
    if (process.env.LOCAL_TEST_MODE === 'true') {
      console.log('Running in LOCAL_TEST_MODE.');
      readmeContent = await fs.readFile('tests/local-template.md', 'utf-8');
    } else {
      const remote = await provider.getReadmeContent();
      readmeContent = remote.content;
      readmeSha = remote.sha as any;
    }

    // Pass maxPrs to runCore
    let username: string;
    if (process.env.LOCAL_TEST_MODE === 'true') {
      if (!process.env.GITHUB_USERNAME) {
        throw new Error('GITHUB_USERNAME must be set in your .env file for local testing.');
      }
      username = process.env.GITHUB_USERNAME;
    } else {
      username = await provider.getRepoOwner();
    }
    newReadmeContent = await runCore(provider, username, plugins, readmeContent, pluginConfig);

    // Conditional write based on mode
    if (process.env.LOCAL_TEST_MODE === 'true') {
      await fs.writeFile('tests/local-output.md', newReadmeContent);
      console.log('Local output written to tests/local-output.md.');
    } else {
      if (newReadmeContent !== readmeContent) {
        await provider.updateReadme(newReadmeContent, 'docs: update README with metrics');
        console.log('Updated README with metrics on remote provider.');
      } else {
        console.log('No changes to README needed on remote provider.');
      }
    }

  } catch (error: any) {
    core.setFailed(error.message);
  }
  return newReadmeContent;
}

run();