import * as luxon from 'luxon';
import * as utils from '../utils';

import type { API, Message } from 'zca-js';
import type { Config, ModuleProps, PollConfig, ScheduleFrequency } from "../types";

async function handleCreate(send: Function, api: API, event: Message, args: string[]) {
  let content = args.join(' ');
  let now = luxon.DateTime.now();
  if (!content) return send('Thiếu nội dung cuộc thăm dò ý kiến');
  let [question, ...options] = content.split('\n').map(s => s.trim());
  if (!question || options.length < 2) return send('Nội dung cuộc thăm dò không hợp lệ');
  let text = question.replace('[date]', now.toFormat('dd/MM/yyyy')).replace('[time]', now.toFormat('HH:mm'));
  const poll = await api.createPoll({ text }, options, event.threadId);
  const config = await utils.readConfig();
  let pollData: PollConfig = {
    pollId: poll.poll_id,
    threadId: event.threadId,
    options: options,
    question: question,
    schedule: {
      lastCronTime: null,
      data: [],
    },
  }
  config.polls.push(pollData);
  await utils.writeConfig(config);
  return send('Đã tạo cuộc thăm dò ý kiến - ID: ' + poll.poll_id);
}

async function handleDelete(send: Function, api: API, event: Message, args: string[]) {
  const config = await utils.readConfig();
  const poll = config.polls.find(p => p.threadId === event.threadId);
  if (!poll) return send('Không tìm thấy cuộc thăm dò ý kiến');
  await api.lockPoll(parseInt(poll.pollId, 10));
  config.polls = config.polls.filter(p => p.threadId !== event.threadId);
  await utils.writeConfig(config);
  return send('Đã xóa cuộc thăm dò ý kiến - ID: ' + poll.pollId);
}

async function handleInfo(send: Function, config: Config, event: Message) {
  if (config.polls.length === 0) return send('Không có cuộc thăm dò ý kiến nào');
  if (!config.polls.some(p => p.threadId === event.threadId)) return send('Không có cuộc thăm dò ý kiến trong nhóm này');
  const poll = config.polls.find(p => p.threadId === event.threadId);
  return send(`Cuộc thăm dò ý kiến hiện tại:\n${poll!.question} - ID: ${poll!.pollId}`);
}

export default async function command({ send, api, args, data, event }: ModuleProps) {
  const config = await utils.readConfig();
  const [subCommand, ...subArgs] = args;

  switch (subCommand) {
    case 'create':
      return handleCreate(send, api, event, subArgs);
    case 'delete':
      return handleDelete(send, api, event, subArgs);
    case 'info':
      return handleInfo(send, config, event);
    default:
      return send('Invalid subcommand');
  }
}

export async function pollSchedule({ api }: Partial<ModuleProps>) {
  utils.logger.verbose('Poll schedule started');
  while (true) {
    let config = await utils.readConfig();
    let polls = config.polls.filter(p => p.schedule.data.length > 0);
    if (polls.length === 0) {
      await new Promise(r => setTimeout(r, 2000));
      polls = config.polls.filter(p => p.schedule.data.length > 0);
      continue;
    }
    const now = luxon.DateTime.now();
    const currentTime = now.toFormat('HH:mm');


    for (const poll of polls) {

      if (poll.schedule.lastCronTime === currentTime) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const [frequency, time, day, month] = poll.schedule.data;
      const scheduleMatches: Record<ScheduleFrequency, boolean> = {
        hourly: now.minute === parseInt(time!, 10),
        daily: currentTime === time,
        weekly: currentTime === time && now.weekday === day,
        monthly: currentTime === time && now.day === day,
        yearly: currentTime === time && now.day === day && now.month === month,
      };
      if (scheduleMatches[frequency!]) {
        utils.logger.verbose(`Running poll schedule for thread ${poll.threadId}`);
        let pollData = config.polls.find(p => p.threadId === poll.threadId);
        if (!pollData) continue;
        let text = pollData.question.replace('[date]', now.toFormat('dd/MM/yyyy')).replace('[time]', now.toFormat('HH:mm'));
        let newPoll = await api!.createPoll({ text: text }, pollData.options, poll.threadId);
        pollData.pollId = newPoll.poll_id;
        poll.schedule.lastCronTime = currentTime;
        await utils.writeConfig(config);
      }
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}