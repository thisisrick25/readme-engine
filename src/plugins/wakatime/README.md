# WakaTime Plugin

This plugin fetches and displays your coding activity from [WakaTime](https://wakatime.com) as a single combined block. You choose which sections to render via the `sections` config option. Each section maps to WakaTime endpoints that are accessible on the free tier:

| Section key  | Renders                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `last30`     | **Last 30 Days** — total, daily average, top languages, and top editors with percentages (`stats/last_30_days`).                            |
| `allTime`    | **All Time** — lifetime top languages and editors with percentages (`stats/all_time`).                                                      |
| `sinceToday` | **All-Time Total** — a single lifetime total coding time headline (`all_time_since_today`).                                                  |
| `insights`   | **Last Year Insights** — rolling one-year top languages and editors (`insights/languages/last_year`, `insights/editors/last_year`).         |

> The `insights/*` endpoints only return data for the `last_year` range on the free tier and expose raw seconds only, so percentages are computed by the plugin.

Sections render in the order you list them. Each section also degrades gracefully: if an endpoint is unavailable (for example, `insights/*` on shorter ranges requires a paid plan), that section is simply omitted and the rest still render.

## Prerequisites

You need a WakaTime account and its API key:

1. Sign up at [wakatime.com](https://wakatime.com) and install the WakaTime plugin in your editor(s).
2. Copy your API key from [wakatime.com/settings/api-key](https://wakatime.com/settings/api-key).
3. Add it as a repository secret named `WAKATIME_API_KEY` in the repository where this action runs (**Settings → Secrets and variables → Actions → New repository secret**).

## Usage

To enable this plugin, include `wakatime` in the `PLUGINS` input and pass the API key to the step via the `WAKATIME_API_KEY` environment variable:

```yaml
- name: Update README with readme-engine
  uses: thisisrick25/readme-engine@v2
  env:
    WAKATIME_API_KEY: ${{ secrets.WAKATIME_API_KEY }}
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PLUGINS: wakatime
```

The API key is read from the environment (`process.env.WAKATIME_API_KEY`) and is intentionally **not** part of `PLUGIN_CONFIG`, keeping the secret out of the README output and config JSON.

## Placeholder

Add the following placeholder comments to your target Markdown file where you want the stats injected:

```markdown
<!-- WAKATIME:START -->
<!-- WAKATIME:END -->
```

The content between these comments is automatically replaced by the generated WakaTime stats block.

## Example Output

```markdown
<!-- WAKATIME:START -->
### WakaTime

**All-Time Total:** 2,264 hrs 20 mins (since Thu Sep 3rd 2020)

#### Last 30 Days

**Total:** 42 hrs 18 mins • **Daily average:** 1 hr 24 mins

_Languages_

​```text
TypeScript  ██████████░░░░░░░░░░   48.2%  20 hrs 24 mins
Python      █████░░░░░░░░░░░░░░░░   24.1%  10 hrs 12 mins
​```

_Editors_

​```text
VS Code     ████████████████░░░░   82.5%  34 hrs 54 mins
​```

#### All Time

**Total:** 1,304 hrs 51 mins

_Languages_

​```text
Other       ████████░░░░░░░░░░░░   42.4%  552 hrs 45 mins
TypeScript  ███░░░░░░░░░░░░░░░░░░   16.6%  216 hrs 42 mins
​```

#### Last Year Insights

_Languages_

​```text
TypeScript  ████████░░░░░░░░░░░░   40.1%  161h 25m
Python      ████░░░░░░░░░░░░░░░░   18.3%  73h 40m
​```
<!-- WAKATIME:END -->
```

## Configuration

Configure which sections to display via the `wakatime.sections` key in `PLUGIN_CONFIG`. It accepts an array of section keys (`last30`, `allTime`, `sinceToday`, `insights`). Sections render in the order given, and duplicates are ignored.

**If `sections` is omitted, only `last30` is rendered** (the default), preserving the original single-block behavior.

```yaml
- name: Update README with readme-engine
  uses: thisisrick25/readme-engine@v2
  env:
    WAKATIME_API_KEY: ${{ secrets.WAKATIME_API_KEY }}
  with:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PLUGINS: wakatime
    PLUGIN_CONFIG: |
      {
        "wakatime": {
          "sections": ["last30", "allTime", "sinceToday", "insights"]
        }
      }
```

The number of languages and editors shown in each breakdown defaults to `5`.

The WakaTime API key **must** be provided via the `WAKATIME_API_KEY` environment variable, not `PLUGIN_CONFIG`.
