import type { Octokit, BasePluginConfig } from './types.ts';
import { pluginRegistry } from './plugins/index.js';

// Helper function to escape characters for use in a regular expression
function escapeRegExp(param: string): string {
    return param.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export default async function runCore(octokit: Octokit, username: string, plugins: string[], readmeContent: string, pluginConfig: Record<string, BasePluginConfig>): Promise<string> {
    let newReadmeContent = readmeContent;

    for (const pluginName of plugins) {
        const plugin = pluginRegistry[pluginName];

        if (plugin) {
            try {
                console.log(`Running plugin: ${pluginName}...`);

                const result = await plugin(octokit, username, pluginConfig[pluginName] || {});
                const tagName = pluginName.toUpperCase();
                const startComment = `<!-- ${tagName}:START -->`;
                const endComment = `<!-- ${tagName}:END -->`;
                const replacement = `${startComment}\n${result}\n${endComment}`;
                const regex = new RegExp(`${escapeRegExp(startComment)}[\\s\\S]*${escapeRegExp(endComment)}`);

                newReadmeContent = newReadmeContent.replace(regex, replacement);
                console.log(`Plugin ${pluginName} finished successfully.`);

            } catch (error) {
                console.error(`Error running plugin ${pluginName}:`, error);
            }
        } else {
            console.warn(`Plugin "${pluginName}" is not recognized or registered.`);
        }

    }

    return newReadmeContent;
}