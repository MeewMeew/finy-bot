import * as logger from './logger';

import type { Config } from '../types';
import { fileExists } from './common';

// Create a default configuration file if it doesn't exist
export const createConfig = async () => {
  const defaultConfig: Config = {
    prefix: '/',
    admins: [],
    customerCare: {
      index: 0,
      delay: 1,
      templates: [],
      schedule: {
        lastCronTime: "",
        data: [],
      },
      phoneNumbers: [],
    },
    userAgent: '',
    knownPhoneNumbers: {},
    polls: [],
  };

  try {
    if (!(await fileExists('config.json'))) {
      await Bun.write('config.json', JSON.stringify(defaultConfig, null, 2));
      logger.done('Default config file created');
    } else {
      const existingConfig = (await Bun.file('config.json').json()) as Config;
      const updatedConfig = { ...defaultConfig, ...existingConfig };
      await Bun.write('config.json', JSON.stringify(updatedConfig, null, 2));
      logger.done('Config file updated with defaults');
    }
  } catch (error) {
    logger.error('Error creating or updating config file:', error);
  }
};

// Load configuration file
export const readConfig = async (): Promise<Config> => {
  try {
    return (await Bun.file('config.json').json()) as Config;
  } catch (error) {
    logger.error('Error loading config file:', error);
    throw error;
  }
};

// Write updated configuration file
export const writeConfig = async (config: Config) => {
  try {
    await Bun.write('config.json', JSON.stringify(config, null, 2));
    logger.done('Configuration modified');
  } catch (error) {
    logger.error('Error writing to config file:', error);
  }
};
