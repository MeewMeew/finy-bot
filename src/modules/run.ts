import type { ModuleProps } from "../types";

export default async function command({ send, api, args, data, event }: ModuleProps) {
  let out = async (msg: unknown) => {
    if (typeof msg === 'object') msg = JSON.stringify(msg, null, 2) === '{}' ? msg!.toString() : JSON.stringify(msg, null, 2)
    else !msg ? '' : msg = (msg as unknown)!.toString()
    if (msg) return send(msg as string)
  }

  let content: string = args.join(' ')
  if (args.length === 0) return out(undefined)
  while (content.indexOf('\n') === 0) content.replace('\n', '')

  try {
    if (content.includes('out(')) return await eval(`(async () => {${content}})()`)
    const split = content.split('\n')
    if (split.length === 1) return await out(await eval(`(async () => {return ${content}})()`))
    const lastIndex = split[split.length - 1]
    if (lastIndex?.indexOf('=') !== -1) {
      split[split.length - 1] = `return ${lastIndex?.substring(lastIndex.indexOf('=') + 1)}`
    }
    return await out(await eval(`(async () => {${split.join(' ')}})()`))
  } catch (error) {
    return out(error)
  }
}