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

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
