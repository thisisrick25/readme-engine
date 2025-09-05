// local-test.js
import 'dotenv/config';
import { getOctokit } from '@actions/github';
import { promises as fs } from 'fs';

import runCore from '../src/core.js';
import type { PluginsConfig } from '../src/types.js';


async function test(): Promise<void> {
  console.log("--- Running local test ---");

  // For local testing, we still need a username to pass to the plugins
  // Type-safe and robust handling of environment variables
  const username = process.env.GITHUB_USERNAME; 
  const token = process.env.GITHUB_TOKEN;

  if (!token || !username) {
    console.error("Error: GITHUB_TOKEN and GITHUB_USERNAME must be set in your .env file.");
    process.exit(1); // Exit with a failure code
  }

  const plugins = ["prs", "notable-contributions"];

  // Use our central PluginsConfig type for type safety
  const pluginConfig: PluginsConfig = {
    prs: { maxPrs: 10 },
    'notable-contributions': { maxPrs: 10 }
  };

  const octokit = getOctokit(token);

  // Read the template file
  const template = await fs.readFile('tests/local-template.md', 'utf-8');

  // Run the core engine with the template content
  const newContent = await runCore(octokit, username, plugins, template, pluginConfig);

  // Write the final content to the output file
  await fs.writeFile('tests/local-output.md', newContent);

  console.log("--- Test complete ---");
  console.log("Output written to tests/local-output.md");
}

test();
