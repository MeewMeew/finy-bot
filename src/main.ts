import type { API, Credentials } from 'zca-js';
import type { Config, GlobalData } from './types';
import {
  createConfig,
  extractEvent,
  fileExists,
  getSendMessage,
  isAdmin,
  logger,
  mkdir,
  validCredentials,
} from './utils';
import cskh, { customerCareSchedule } from './modules/cskh';
import poll, { pollSchedule } from './modules/poll';

import { Zalo } from 'zca-js';
import help from './modules/help';
import run from './modules/run';
import schedule from './modules/schedule';
import uid from './modules/uid';
import { unlink } from 'node:fs/promises';
import uptime from './modules/uptime';
import xlsx from './modules/xlsx';

// Utility function to safely read JSON files
const readJsonFile = async (path: string) => {
  try {
    return await Bun.file(path).json();
  } catch (err) {
    logger.error(`Error reading ${path}:`, err);
    return null;
  }
};

(async () => {
  logger.clear();
  await mkdir('temp');
  await createConfig();

  const config = (await readJsonFile('config.json')) as Config;
  if (!config || typeof config.prefix !== 'string') {
    logger.error('Invalid configuration file. Check your config.json');
    process.exit(1);
  }

  const zalo = new Zalo({
    checkUpdate: false,
    selfListen: true,
    logging: false,
  });

  let credentials: Partial<Credentials> = {};
  let api: API | null = null;

  let data: GlobalData = {
    xlsx: {
      phone: [],
    },
  };

  if (await fileExists('credentials.json')) {
    credentials = (await readJsonFile('credentials.json')) || {};
  }

  try {
    if (validCredentials(credentials)) {
      api = await zalo.login(credentials as Credentials);
      logger.clear();
      process.title = `Zalo Bot - ${api.getOwnId()}`;
      logger.done('Logged in as', api.getOwnId());
    } else {
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    await unlink('credentials.json');
    logger.error('Login error:', error);
    process.exit(1);
  }

  let reconnectAttempts = 0;

  // Event listener for messages
  api.listener.on('message', async (event) => {
    let content =
      typeof event.data.content === 'string'
        ? event.data.content
        : event.data.content.title;
    if (!content) return;
    if (!content.startsWith(config.prefix)) return;

    const { command, args } = await extractEvent(content);
    const send = getSendMessage(api, event);

    logger.verbose('Execute command:', command, '|', event.data.uidFrom);

    try {
      if (await isAdmin(event)) {
        if (command === 'cskh') {
          await cskh({ send, api, args, data, event });
        } else if (command === 'xlsx') {
          await xlsx({ send, api, args, data, event });
        } else if (command === 'run') {
          await run({ send, api, args, data, event });
        } else if (command === 'schedule') {
          await schedule({ send, api, args, data, event });
        } else if (command === 'poll') {
          await poll({ send, api, args, data, event });
        }
      }

      if (command === 'uid') {
        await uid({ send, api, args, data, event });
      } else if (command === 'uptime') {
        await uptime({ send, api, args, data, event });
      } else if (command === 'help') {
        await help({ send, api, args, data, event });
      } else {
        await send(
          `Lệnh không hợp lệ, sử dụng ${config.prefix}help để xem danh sách lệnh`
        );
      }
    } catch (error) {
      logger.error('Error executing command:', error);
    }
  });

  api.listener.onConnected(() => {
    reconnectAttempts = 0;
    logger.done('Connected to Zalo server');
    customerCareSchedule({ api });
    pollSchedule({ api });
  });

  api.listener.onClosed(() => {
    logger.warn('Disconnected from Zalo server');
    if (++reconnectAttempts != 0) {
      setTimeout(() => {
        logger.info(`Reconnecting... Attempt ${reconnectAttempts}`);
        api.listener.start();
      }, 5000);
    }
  });

  api.listener.on('error', (error) => {
    logger.error('An error occurred:', error);
  });

  api.listener.start();
})();
