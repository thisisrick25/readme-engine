import * as core from '@actions/core';
import * as github from '@actions/github';
import { promises as fs } from 'fs';
import runCore from './core.js';

import type { PluginsConfig, GetContentResponseData } from './types.js';

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

    const octokit = github.getOctokit(githubToken);

    // Determine source of README content based on mode
    if (process.env.LOCAL_TEST_MODE === 'true') {
      console.log('Running in LOCAL_TEST_MODE.');
      readmeContent = await fs.readFile('local-template.md', 'utf-8');
    } else {
      // Original remote behavior
      const { owner, repo } = github.context.repo;
      const readmePath = 'README.md';

      const response = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: readmePath
      });

      const readmeData = response.data as GetContentResponseData;

      // Ensure content is a string before decoding
      if (readmeData.content) {
        readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        readmeSha = readmeData.sha;
      } else {
        throw new Error('Could not read README content. Response did not contain a content field.');
      }
    }

    // Pass maxPrs to runCore
    let username: string;
    if (process.env.LOCAL_TEST_MODE === 'true') {
      if (!process.env.GITHUB_USERNAME) {
        throw new Error('GITHUB_USERNAME must be set in your .env file for local testing.');
      }
      username = process.env.GITHUB_USERNAME;
    } else {
      username = github.context.repo.owner;
    }
    newReadmeContent = await runCore(octokit, username, plugins, readmeContent, pluginConfig);

    // Conditional write based on mode
    if (process.env.LOCAL_TEST_MODE === 'true') {
      await fs.writeFile('local-output.md', newReadmeContent);
      console.log('Local output written to local-output.md.');
    } else {
      if (newReadmeContent !== readmeContent && readmeSha) {
          await octokit.rest.repos.createOrUpdateFileContents({
              owner: github.context.repo.owner,
              repo: github.context.repo.repo,
              path: 'README.md',
              message: 'docs: update README with metrics',
              content: Buffer.from(newReadmeContent, 'utf-8').toString('base64'),
              sha: readmeSha // Use stored SHA for remote update
          });
          console.log('Updated README with metrics on GitHub.');
      } else {
          console.log('No changes to README needed on GitHub.');
      }
    }

  } catch (error: any) {
    core.setFailed(error.message);
  }
  return newReadmeContent;
}

run();