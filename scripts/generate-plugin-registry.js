import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the absolute path to the 'src/plugins' directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginsDir = path.resolve(__dirname, '../src/plugins');
const outputFile = path.resolve(pluginsDir, 'index.ts');

async function generateRegistry() {
  console.log('Generating plugin registry...');
  try {
    const pluginDirs = await fs.readdir(pluginsDir, { withFileTypes: true });
    
    const imports = [];
    const registryEntries = [];

    for (const dirent of pluginDirs) {
      // Process only directories, and ignore the 'index.ts' file itself
      if (dirent.isDirectory()) {
        const pluginName = dirent.name;
        const camelCaseName = pluginName.replace(/-(\w)/g, (_, c) => c.toUpperCase()) + 'Plugin';

        imports.push(`import ${camelCaseName} from './${pluginName}/index.js';`);
        registryEntries.push(`  '${pluginName}': ${camelCaseName},`);
      }
    }

    const fileContent = `// ---------------------------------------------------------------- //
// THIS IS A GENERATED FILE. DO NOT EDIT IT DIRECTLY.               //
// To add a new plugin, create a new folder in the plugins directory. //
// Then run \`npm run generate-plugins\` to regenerate this file.     //
// ---------------------------------------------------------------- //

import type { Plugin } from '../types.js';

${imports.join('\n')}

export const pluginRegistry: Record<string, Plugin> = {
${registryEntries.join('\n')}
};
`;

    await fs.writeFile(outputFile, fileContent, 'utf-8');
    console.log(`Plugin registry successfully generated at ${outputFile}`);

  } catch (error) {
    console.error('Error generating plugin registry:', error);
    process.exit(1);
  }
}

generateRegistry();