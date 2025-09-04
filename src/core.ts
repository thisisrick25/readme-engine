import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

import type { Octokit, PluginModule, BasePluginConfig } from './types.ts';

// Helper function to escape characters for use in a regular expression
function escapeRegExp(param: string): string {
  return param.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export default async function runCore(octokit: Octokit, username: string, plugins: string[], readmeContent: string, pluginConfig: Record<string, BasePluginConfig> ): Promise<string> {
    let newReadmeContent = readmeContent;

    const pluginsDirUrl = new URL('plugins/', import.meta.url);
    const pluginsDirPath = fileURLToPath(pluginsDirUrl);

    for (const pluginName of plugins) {
        try {
            const pluginPath = path.join(pluginsDirPath, pluginName, 'index.js');
            if (fs.existsSync(pluginPath)) {
                const plugin: PluginModule = await import(pluginPath);
                const result = await plugin.default(octokit, username, pluginConfig[pluginName] || {});

                const tagName = pluginName.toUpperCase();
                const startComment = `<!-- ${tagName}:START -->`;
                const endComment = `<!-- ${tagName}:END -->`;
                const replacement = `${startComment}\n${result}\n${endComment}`;
                const regex = new RegExp(`${escapeRegExp(startComment)}[\\s\\S]*${escapeRegExp(endComment)}`);

                newReadmeContent = newReadmeContent.replace(regex, replacement);
            } else {
                console.warn(`Plugin at path "${pluginPath}" not found.`);
            }
        } catch (error) {
            console.error(`Error running plugin ${pluginName}:`, error);
        }
    }

    return newReadmeContent;
}