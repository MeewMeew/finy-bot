import { DateTime } from "luxon";

// Logger utility for consistent logging
export const verbose = (...args: any[]) => console.log(DateTime.now().toFormat('dd/MM/yyyy HH:mm:ss'), '\x1b[2m🐇 VERBOSE\x1b[0m', ...args);
export const info = (...args: any[]) => console.log(DateTime.now().toFormat('dd/MM/yyyy HH:mm:ss'), '\x1b[34mINFO\x1b[0m', ...args);
export const warn = (...args: any[]) => console.log(DateTime.now().toFormat('dd/MM/yyyy HH:mm:ss'), '\x1b[33mWARN\x1b[0m', ...args);
export const error = (...args: any[]) => console.log(DateTime.now().toFormat('dd/MM/yyyy HH:mm:ss'), '\x1b[31mERROR\x1b[0m', ...args);
export const done = (...args: any[]) => console.log(DateTime.now().toFormat('dd/MM/yyyy HH:mm:ss'), '\x1b[32mDONE\x1b[0m', ...args);
export const clear = () => process.stdout.write('\x1Bc');