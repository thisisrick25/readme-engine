const core = require('@actions/core');
const github = require('@actions/github');
const runCore = require('./src/core.js');
const fs = require('fs').promises; // Add fs for local file operations

async function run() {
  let newReadmeContent = '';
  let readmeContent = '';
  let readmeSha = ''; // To store SHA for remote update
  try {
    const githubToken = core.getInput('GITHUB_TOKEN');
    const plugins = core.getInput('PLUGINS').split(',').map(p => p.trim());
    const maxPrs = parseInt(core.getInput('MAX_PRS'), 10);

    const octokit = github.getOctokit(githubToken);

    // Determine source of README content based on mode
    if (process.env.LOCAL_TEST_MODE === 'true') {
      console.log('Running in LOCAL_TEST_MODE.');
      readmeContent = await fs.readFile('local-template.md', 'utf-8');
    } else {
      // Original remote behavior
      const readmeRepo = github.context.repo.repo;
      const readmePath = 'README.md';

      const { data: readmeData } = await octokit.rest.repos.getContent({
          owner: github.context.repo.owner,
          repo: readmeRepo,
          path: readmePath
      });
      readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      readmeSha = readmeData.sha; // Store SHA for remote update
    }

    // Pass maxPrs to runCore
    let username;
    if (process.env.LOCAL_TEST_MODE === 'true') {
      username = process.env.GITHUB_USERNAME;
    } else {
      username = github.context.repo.owner;
    }
    newReadmeContent = await runCore(octokit, username, plugins, readmeContent, maxPrs);

    // Conditional write based on mode
    if (process.env.LOCAL_TEST_MODE === 'true') {
      await fs.writeFile('local-output.md', newReadmeContent);
      console.log('Local output written to local-output.md.');
    } else {
      if (newReadmeContent !== readmeContent) {
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

  } catch (error) {
    core.setFailed(error.message);
  }
  return newReadmeContent;
}

// Export the run function
module.exports = run;

run();