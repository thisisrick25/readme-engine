# Notable Contributions Plugin

This plugin fetches and displays a list of your most recent merged pull requests that were made to repositories you do not own. This highlights your contributions to the broader open-source community.

## Usage

To enable this plugin, include `notable-contributions` in the `PLUGINS` input of the main action:

```yaml
- uses: your-username/your-action-repo@main
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB.TOKEN }}
    PLUGINS: notable-contributions
    MAX_PRS: 5 # Optional: specify the maximum number of notable contributions to display (default is 5)
```

## Placeholder

To display the notable contributions in your README, you must include the following placeholder comments in your target Markdown file:

```markdown
<!-- NOTABLE-CONTRIBUTIONS:START -->
<!-- NOTABLE-CONTRIBUTIONS:END -->
```

The content between these comments will be automatically replaced by the generated list of notable contributions.

## Example Output

```markdown
<!-- NOTABLE-CONTRIBUTIONS:START -->
- [Feat: Added new API endpoint to external-lib/repo](https://github.com/external-lib/repo/pull/123)
- [Fix: Resolved critical bug in community-project/repo](https://github.com/community-project/repo/pull/456)
<!-- NOTABLE-CONTRIBUTIONS:END -->
```

## Configuration

This plugin uses the `USERNAME` (inferred from `github.context.repo.owner`) to determine whose contributions to fetch.

### `MAX_PRS`

**Optional**. Specifies the maximum number of notable contributions to display. If not provided, it defaults to 5.
