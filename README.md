# readme-engine

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/thisisrick25/readme-engine/release-please.yml?branch=main)

A GitHub Action to dynamically update sections of your profile README. It features a plugin-based architecture, allowing you to easily showcase your latest GitHub activity right on your profile.

The action works by finding placeholder comments in your README and replacing the content between them with the output from the specified plugins.

## Features

- **Dynamic Content Generation:** Automatically updates sections of your README.
- **Extensible Plugin System:** Easily add new content types via plugins.
- **Pull Request Integration:** Display your latest merged PRs.
- **Automated Releases:** Integrated with Release Please for seamless versioning and publishing.

## Usage

To use this action, create a workflow file (e.g., `.github/workflows/update-readme.yml`) in your repository. Here is an example that runs the action every 6 hours:

```yaml
name: Update README

on:
  schedule:
    - cron: "0 */6 * * *" # Runs every 6 hours
  workflow_dispatch: # Allows manual triggering

jobs:
  update-readme:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Update README with readme-engine
        uses: thisisrick25/readme-engine@v2 # Use the latest major version
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PLUGINS: prs
```

Next, add the placeholder comments to your `README.md` file where you want the content to be injected. The tag name corresponds to the plugin name in uppercase.

```markdown
## My Recent Pull Requests

<!-- PRS:START -->
<!-- This content will be replaced by the `prs` plugin -->
<!-- PRS:END -->

## My Notable Open Source Contributions

<!-- NOTABLE-CONTRIBUTIONS:START -->
<!-- This content will be replaced by the `notable-contributions` plugin -->
<!-- NOTABLE-CONTRIBUTIONS:END -->
```

### Inputs

| Input Name      | Description                                                                   | Required |
| :-------------- | :---------------------------------------------------------------------------- | :------- |
| `GITHUB_TOKEN`  | The GitHub token to use for authentication.                                   | `true`   |
| `PLUGINS`       | A comma-separated list of plugins to run.                                     | `true`   |
| `PLUGIN_CONFIG` | An optional JSON string for providing specific configurations to each plugin. | `false`  |

### Plugins

`readme-engine` is designed with a plugin system to allow for various types of dynamic content. Each plugin is responsible for generating a specific section of your README.

| Plugin Name                                                  | Description                                                                    |
| :----------------------------------------------------------- | :----------------------------------------------------------------------------- |
| [`notable-contributions`](src/plugins/notable-contributions) | Displays your most recent merged pull requests to repositories you do not own. |
| [`prs`](src/plugins/prs)                                     | Fetches and displays your latest merged Pull Requests.                         |

## Configuration

You can customize the behavior of each plugin using the `PLUGIN_CONFIG` input. This input accepts a JSON string where keys are the plugin names.

### Example: Customizing `maxPrs`

To change the maximum number of pull requests displayed by each plugin, you can provide the following configuration:

```yaml
- name: Update README
        uses: thisisrick25/readme-engine@v2
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PLUGINS: prs, notable-contributions
          PLUGIN_CONFIG: '{ "prs": { "maxPrs": 8 }, "notable-contributions": { "maxPrs": 4 } }'
```

This configuration will:

- Show up to 8 pull requests for the `prs` plugin.
- Show up to 4 pull requests for the `notable-contributions` plugin.

## Contributing

Contributions to `readme-engine` are welcomed! If you're interested in improving this action or [adding a new plugin](CONTRIBUTING.md#adding-a-new-plugin), please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to set up your environment and run tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
