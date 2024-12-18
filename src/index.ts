import { getFile, logger } from './utils';

import type { Subprocess } from 'bun';
import { compare } from 'semver';
import extract from 'extract-zip';
import { unlink } from 'node:fs/promises';
import xior from 'xior';

(async () => {
  // Get the current version from package.json
  const { version } = await Bun.file('package.json').json();

  // Start the main subprocess
  let main: Subprocess = Bun.spawn(["bun", "run", "./build/main.js"], {
    cwd: process.cwd(),
  });

  while (true) {
    // Fetch the latest release information from GitHub
    const { data } = await xior.get('https://api.github.com/repos/meewmeew/finy-bot/releases/latest', {
      headers: {
        'User-Agent': 'meewmeew'
      }
    });

    // Compare versions to check for updates
    if (compare(version, data.tag_name) === -1) { // Changed to -1 to check if an update is available
      logger.warn(`Update available: ${data.tag_name}`);
      logger.info('Updating...');

      // Kill the current main subprocess
      main.kill();

      // Download the update tarball
      const filePath = await getFile(data.assets[0].browser_download_url, 'finy-bot.zip');
      if (!filePath) continue;

      // Extract the downloaded file
      await extract(filePath, { dir: process.cwd() });

      logger.info('Installing dependencies...');

      // Install dependencies and build the project
      const installProcess = Bun.spawn(["bun", "install"], {
        cwd: process.cwd(),
        onExit: () => {
          logger.info('Building...');
          const buildProcess = Bun.spawn(["bun", "run", "build"], {
            cwd: process.cwd(),
            onExit: async () => {
              logger.done('Update complete 🎉');

              // Restart the main subprocess
              main = Bun.spawn(["bun", "run", "./build/main.js"], {
                cwd: process.cwd(),
                stdout: 'inherit',
              });
              await unlink(filePath);
            }
          });
        },
      });
    }

    // Wait for 60 seconds before checking for updates again
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
})();
