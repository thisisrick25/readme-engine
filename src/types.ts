import { getOctokit } from '@actions/github';

/**
 * The official type for the Octokit instance provided by `@actions/github`.
 */
export type Octokit = ReturnType<typeof getOctokit>;

/**
 * Defines the configuration options that can be passed to any plugin.
 * We can extend this for more specific plugin configs.
 */
export interface BasePluginConfig {
  maxPrs?: number;
  // Add other common options here in the future
}

/**
 * Defines the function signature for a readme-engine plugin.
 * This is the "contract" that all plugins must adhere to.
 */
export type Plugin = (
  octokit: Octokit,
  username: string,
  config: BasePluginConfig
) => Promise<string>;

/**
 * Defines the shape of a dynamically imported plugin module.
 * Since we use `export default`, the main function will be on the `default` property.
 */
export type PluginModule = {
  default: Plugin;
};

/**
 * The main configuration object, mapping plugin names to their specific configs.
 */
export type PluginsConfig = Record<string, BasePluginConfig>;

/**
 * Defines the shape of the data we get back from `octokit.rest.repos.getContent`.
 * We only care about the `content` and `sha` properties for a file response.
 */
export interface GetContentResponseData {
  content?: string;
  sha?: string;
}