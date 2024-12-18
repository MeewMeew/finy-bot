import { type Credentials, type Message } from 'zca-js';
import type { Phone } from '../types';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import * as xlsx from 'xlsx';
import xior from 'xior';
import path from 'node:path';
import * as logger from './logger';
import { readConfig } from './config';

// Utility to check if a file exists
export const fileExists = async (filePath: string): Promise<boolean> => {
  return await Bun.file(filePath).exists();
};

// Validate if a file is an Excel file
export const isValidExcelFile = (filePath: string): boolean => {
  const validExtensions = ['.xlsx', '.xls'];
  return validExtensions.includes(path.extname(filePath).toLowerCase());
};

// Read phone data from Excel file with error handling
export const readPhoneData = async (filePath: string, range: string): Promise<Phone[]> => {
  try {
    if (!isValidExcelFile(filePath)) {
      throw new Error(`Invalid file type: ${filePath}`);
    }
    const workbook = xlsx.read(Buffer.from(readFileSync(filePath)));
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return xlsx.utils.sheet_to_json(sheet, { range });
  } catch (error) {
    logger.error('Error reading phone data:', error);
    return [];
  }
};

// Validate credentials for Zalo API
export const validCredentials = (credentials: Partial<Credentials>): boolean => {
  return !!credentials.cookie && !!credentials.imei && !!credentials.userAgent;
};

// Extract command and arguments from a event
export const extractEvent = async (event: string): Promise<{
  command: string;
  args: string[];
}> => {
  const config = await readConfig();
  const [command, ...args] = event.slice(config.prefix.length).split(' ');
  return { command, args };
};

// Check if a user is an admin
export const isAdmin = async (event: Message): Promise<boolean> => {
  const config = await readConfig();
  return config.admins.includes(event.data.uidFrom) || event.isSelf;
};

// Download a file and save it locally
export const getFile = async (url: string, filename?: string): Promise<string | null> => {
  try {
    const response = await xior.get(url, { responseType: 'arraybuffer' });
    const savePath = `./temp/${filename || path.basename(url)}`;
    await Bun.write(savePath, response.data);
    logger.done(`File saved to ${savePath}`);
    return savePath;
  } catch (error) {
    logger.error(`Failed to download file: ${url}`, error);
    return null;
  }
};

// Create a directory if it doesn't exist
export const mkdir = async (dirPath: string) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath);
    logger.done(`Directory created: ${dirPath}`);
  }
};