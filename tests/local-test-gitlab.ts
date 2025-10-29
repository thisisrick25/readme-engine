import 'dotenv/config';
import { promises as fs } from 'fs';
import { Gitlab } from '@gitbeaker/rest';

import runCore from '../src/core.js';
import { createGitLabProvider } from '../src/providers.js';
import type { PluginsConfig } from '../src/types.js';

async function test(): Promise<void> {
    console.log('--- Running local GitLab test ---');

    const token = process.env.GITLAB_TOKEN;
    const projectId = process.env.GITLAB_PROJECT_ID;
    const username = process.env.GITLAB_USERNAME;

    if (!token || !projectId || !username) {
        console.error('Error: GITLAB_TOKEN, GITLAB_PROJECT_ID and GITLAB_USERNAME must be set in your .env file.');
        process.exit(1);
    }

    const plugins = ['prs', 'notable-contributions'];

    const pluginConfig: PluginsConfig = {
        prs: { maxPrs: 10 },
        'notable-contributions': { maxPrs: 10 }
    };

    const gitlabHost = process.env.CI_API_V4_URL?.replace(/\/api\/v4\/?$/, '') || 'https://gitlab.com';
    const gitlab = new Gitlab({ host: gitlabHost, token });

    const provider = createGitLabProvider({ gitlab, projectId, ref: process.env.CI_COMMIT_REF_NAME });

    // Read the template file
    const template = await fs.readFile('tests/local-template.md', 'utf-8');

    // Run the core engine with the template content
    const newContent = await runCore(provider, username, plugins, template, pluginConfig);

    // Write the final content to the output file
    await fs.writeFile('tests/local-output-gitlab.md', newContent);

    console.log('--- Test complete ---');
    console.log('Output written to tests/local-output-gitlab.md');
}

test();
