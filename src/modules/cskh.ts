import * as luxon from 'luxon';

import type { ModuleProps, ScheduleFrequency } from '../types';
import { fileExists, getFile, getUserID, logger, readConfig, writeConfig } from '../utils';

import type { MessageContent } from 'zca-js';
import { unlink } from 'node:fs/promises';

export default async function command({ send, api, args, data, event }: ModuleProps) {
  const config = await readConfig();

  async function ensureImageFile(path: string, thumb: string): Promise<string> {
    return (await fileExists(path)) ? path : await getFile(thumb, path) ? path : '';
  }

  function parseId(idArg: string, max: number): number | null {
    const id = parseInt(idArg, 10);
    if (isNaN(id) || id < 1 || id > max) return null;
    return id;
  }

  async function sendMessages(msg: string | MessageContent, delay: number) {
    let success = 0;
    for (const phone of config.customerCare.phoneNumbers) {
      try {
        const uid = await getUserID(api, phone);
        if (!uid) throw new Error(`User ID not found for phone number ${phone}`);
        await api.sendMessage(msg, uid);
        success++;
      } catch (error) {
        logger.error(`Failed to send message to ${phone}`, error);
        await send(`Không thể gửi tin nhắn cho SĐT ${phone}`);
      }
      await new Promise(r => setTimeout(r, delay * 1e3));
    }
    return success;
  }

  if (!config.customerCare.phoneNumbers.length) return send('Vui lòng nhập danh sách SĐT KH trước');
  if (!args.length) return send('Vui lòng nhập nội dung tin nhắn');

  const [command, action, ...restArgs] = args;

  switch (command) {
    case 'template':
      await handleTemplateCommands(action, restArgs);
      break;
    case 'delay':
      await handleDelayCommand(restArgs[0]);
      break;
    default:
      await handleDefaultCommand(args.join(' '));
  }

  async function handleTemplateCommands(action: string, restArgs: string[]) {
    switch (action) {
      case 'new': {
        const text = restArgs.join(' ');
        if (!text) return send('Vui lòng nhập nội dung tin nhắn');
        const imagePath = await getFile(`template_${config.customerCare.templates.length}.jpg`);
        config.customerCare.templates.push({ text, image: imagePath! });
        await writeConfig(config);
        return send(`Đã thêm mẫu tin nhắn mới, ID: ${config.customerCare.templates.length}`);
      }
      case 'list': {
        if (!config.customerCare.templates.length) return send('Không có mẫu tin nhắn nào');
        config.customerCare.templates.forEach((tpl, idx) => send({ msg: `Mẫu số ${idx + 1}:\n\n${tpl.text}`, attachments: [tpl.image] }));
        break;
      }
      case 'delete':
      case 'rm': {
        const id = parseId(restArgs[0], config.customerCare.templates.length);
        if (!id) return send('ID không hợp lệ');
        const { image } = config.customerCare.templates.splice(id - 1, 1)[0];
        await writeConfig(config);
        if (await fileExists(image)) await unlink(image);
        return send(`Đã xóa mẫu tin nhắn số ${id}`);
      }
      case 'select':
      case 'choose': {
        const id = parseId(restArgs[0], config.customerCare.templates.length);
        if (!id) return send('ID không hợp lệ');
        config.customerCare.index = id - 1;
        await writeConfig(config);
        return send(`Đã chọn mẫu tin nhắn số ${id}`);
      }
      case 'send': {
        const id = parseId(restArgs[0] || `${config.customerCare.index + 1}`, config.customerCare.templates.length);
        if (!id) return send('ID không hợp lệ');
        const { text, image } = config.customerCare.templates[id - 1];
        const msg = await fileExists(image) ? { msg: text, attachments: [image] } : text;
        const success = await sendMessages(msg, config.customerCare.delay);
        return send(`Đã gửi tin nhắn CSKH cho ${success} SĐT KH`);
      }
      default:
        return send('Lệnh template không hợp lệ');
    }
  }

  async function handleDelayCommand(delayArg: string) {
    const delay = parseInt(delayArg, 10);
    if (isNaN(delay) || delay < 1) return send('Số giây không hợp lệ');
    config.customerCare.delay = delay;
    await writeConfig(config);
    return send(`Đã cập nhật thời gian chờ giữa các tin nhắn: ${delay} giây`);
  }

  async function handleDefaultCommand(text: string) {
    if (!text) return send('Vui lòng nhập nội dung tin nhắn');
    let msg: string | MessageContent = '';
    let imagePath = '';

    if (event.data.msgType === 'webchat') {
      msg = text;
    } else if (event.data.msgType === 'chat.photo') {
      if (typeof event.data.content === 'object') {
        const thumb = event.data.content.thumb;
        imagePath = await ensureImageFile(`temp/cskh.jpg`, thumb);
        msg = { msg: text, attachments: [imagePath] };
      }
    }
    const success = await sendMessages(msg, config.customerCare.delay);
    await send(`Đã gửi tin nhắn CSKH cho ${success} SĐT KH`);
    if (imagePath) await unlink(imagePath);
  }
}

export async function customerCareSchedule({ api }: Partial<ModuleProps>) {
  logger.verbose('Customer care schedule started');
  while (true) {

    const config = await readConfig();
    if (
      !config.customerCare.phoneNumbers.length ||
      !config.customerCare.templates.length ||
      !config.customerCare.delay ||
      !config.customerCare.schedule.data.length
    ) {
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    const now = luxon.DateTime.now();
    const currentTime = now.toFormat('HH:mm');

    if (config.customerCare.schedule.lastCronTime === currentTime) {
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    const [frequency, time, day, month] = config.customerCare.schedule.data;
    const scheduleMatches: Record<ScheduleFrequency, boolean> = {
      hourly: now.minute === parseInt(time!, 10),
      daily: currentTime === time,
      weekly: currentTime === time && now.weekday === day,
      monthly: currentTime === time && now.day === day,
      yearly: currentTime === time && now.day === day && now.month === month,
    };

    if (scheduleMatches[frequency]) {
      logger.verbose(`Sending customer care messages at ${currentTime}`);
      const { text, image } = config.customerCare.templates[config.customerCare.index];
      const msg = await fileExists(image) ? { msg: text, attachments: [image] } : text;
      for (const phone of config.customerCare.phoneNumbers) {
        try {
          const uid = await getUserID(api!, phone);
          if (!uid) throw new Error(`User ID not found for phone number ${phone}`);
          await api!.sendMessage(msg, uid);
        } catch (error) {
          logger.error(error);
        }
        await new Promise(r => setTimeout(r, config.customerCare.delay * 1000));
      }
      config.customerCare.schedule.lastCronTime = currentTime;
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}
