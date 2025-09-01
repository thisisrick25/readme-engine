// local-test.js
require('dotenv').config();
const { getOctokit } = require('@actions/github');
const fs = require('fs').promises;
const runCore = require('./src/core.js');

async function test() {
  console.log("--- Running local test ---");

  // For local testing, we still need a username to pass to the plugins
  const username = process.env.GITHUB_USERNAME; 
  const plugins = ["prs",  "notable-contributions"];
  const maxPrs = 10; // Example value for testing
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error("Error: GITHUB_TOKEN not found in .env file.");
    return;
  }

  const octokit = getOctokit(token);

  // Read the template file
  const template = await fs.readFile('local-template.md', 'utf-8');

  // Run the core engine with the template content
  const newContent = await runCore(octokit, username, plugins, template, maxPrs);

  // Write the final content to the output file
  await fs.writeFile('local-output.md', newContent);

  console.log("--- Test complete ---");
  console.log("Output written to local-output.md");
}

test();
