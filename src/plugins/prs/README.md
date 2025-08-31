# Pull Requests (PRS) Plugin

This plugin fetches and displays a list of your most recently merged pull requests across all your GitHub repositories.

## Usage

To enable this plugin, include `prs` in the `PLUGINS` input of the main action:

```yaml
- uses: your-username/your-action-repo@main
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB.TOKEN }}
    PLUGINS: prs
    MAX_PRS: 5 # Optional: specify the maximum number of PRs to display (default is 5)
```

## Placeholder

To display the pull requests in your README, you must include the following placeholder comments in your target Markdown file:

```markdown
<!-- PRS:START -->
<!-- PRS:END -->
```

The content between these comments will be automatically replaced by the generated list of pull requests.

## Example Output

```markdown
<!-- PRS:START -->
- [Fix: Corrected regex escaping in core.js](https://github.com/your-username/your-repo/pull/123)
- [Feat: Add modular plugin architecture](https://github.com/your-username/your-repo/pull/122)
- [Docs: Update README with local testing instructions](https://github.com/your-username/your-repo/pull/121)
<!-- PRS:END -->
```

## Configuration

This plugin uses the `USERNAME` input (inferred from `github.context.repo.owner`) to determine whose pull requests to fetch.

### `MAX_PRS`

**Optional**. Specifies the maximum number of pull requests to display. If not provided, it defaults to 5.

Example:

```yaml
MAX_PRS: 10
```
