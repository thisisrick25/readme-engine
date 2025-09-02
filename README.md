# readme-engine

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/thisisrick25/readme-engine/release-please.yml?branch=main)

A GitHub Action to dynamically update your profile README with various content, starting with your latest merged Pull Requests.

## ✨ Features

- **Dynamic Content Generation:** Automatically updates sections of your README.
- **Extensible Plugin System:** Easily add new content types via plugins.
- **Pull Request Integration:** Display your latest merged PRs.
- **Automated Releases:** Integrated with Release Please for seamless versioning and publishing.

## 🚀 Usage

To use `readme-engine` in your GitHub workflow, add the following step to your `.github/workflows/main.yml` (or any other workflow file):

```yaml
name: Update README

on:
  schedule:
    - cron: "0 * * * *" # Runs every hour
  workflow_dispatch: # Allows manual triggering

jobs:
  update-readme:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Update README with readme-engine
        uses: thisisrick25/readme-engine@v1 # Use the latest major version
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PLUGINS: prs
          MAX_PRS: 5
```

### Inputs

| Input Name     | Description                                     | Required | Default |
| :------------- | :---------------------------------------------- | :------- | :------ |
| `GITHUB_TOKEN` | The GitHub token to use for authentication.     | `true`   |         |
| `PLUGINS`      | A comma-separated list of plugins to run.       | `true`   |         |
| `MAX_PRS`      | The maximum number of pull requests to display. | `false`  | `5`     |

### Plugins

`readme-engine` is designed with a plugin system to allow for various types of dynamic content. Each plugin is responsible for generating a specific section of your README.

| Plugin Name                                                  | Description                                                                    |
| :----------------------------------------------------------- | :----------------------------------------------------------------------------- |
| [`notable-contributions`](src/plugins/notable-contributions) | Displays your most recent merged pull requests to repositories you do not own. |
| [`prs`](src/plugins/prs)                                     | Fetches and displays your latest merged Pull Requests.                         |

## 🛠️ Local Development

To develop and test `readme-engine` locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/thisisrick25/readme-engine.git
   cd readme-engine
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root of your project with the following content:

   ```bash
   GITHUB_TOKEN=your_github_token
   GITHUB_USERNAME=your_github_username
   LOCAL_TEST_MODE=true
   ```

   Create a `.secrets` file in the root of your project with your GitHub Token:

   ```bash
   GITHUB_TOKEN=your_github_token
   ```

4. **Run local test script:**

   ```bash
   node local-test.js
   ```

   This will generate `local-output.md` with the updated content.

5. **Test with `act` (simulated GitHub Actions environment):**

   ```bash
   act -b workflow_dispatch
   ```

   This will run the `test-action.yml` workflow and generate `local-output.md`.

6. **Prevent accidental `dist` commits (Husky):**
   The `dist` folder is managed by the release workflow. To prevent accidental commits of the `dist` folder from your local machine, a pre-commit hook is set up using Husky. If you try to commit `dist` files, the commit will be blocked.

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) (coming soon) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
