import * as utils from '../utils';

import type { ModuleProps } from "../types";

export default async function command({ send, api, args, data, event }: ModuleProps) {
  const config = await utils.readConfig();
}
