import * as luxon from 'luxon';
import * as utils from '../utils';

import type { ModuleProps, ScheduleData, ScheduleType } from '../types';

import type { Message } from 'zca-js';

const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

/**
 * Validates and returns a time string in HH:mm format or null if invalid.
 */
function validateTime(input: string): string | null {
  return luxon.DateTime.fromFormat(input, 'HH:mm').isValid ? input : null;
}

/**
 * Parses and validates a number within a given range.
 */
function parseAndValidateNumber(input: string, min: number, max: number): number | null {
  const num = parseInt(input, 10);
  return isNaN(num) || num < min || num > max ? null : num;
}

/**
 * Updates the schedule configuration and sends a confirmation message.
 */
async function updateSchedule(
  send: Function,
  type: ScheduleType,
  event: Message,
  schedule: ScheduleData,
  message: string
) {
  const config = await utils.readConfig();
  const target = type === 'cskh' ? config.customerCare : config.polls.find(p => p.threadId === event.threadId);

  if (!target) {
    return send('Không tìm thấy đối tượng cấu hình phù hợp.');
  }

  target.schedule.data = schedule;
  await utils.writeConfig(config);
  await send(message, false);
}

/**
 * Handles scheduling logic based on the sub-command.
 */
async function handleSchedule(
  send: Function,
  type: ScheduleType,
  event: ModuleProps["event"],
  args: string[]
) {
  const [subCommand, ...params] = args;
  const now = luxon.DateTime.now();

  const validators = {
    time: (input: string | undefined) => validateTime(input || now.toFormat('HH:mm')),
    day: (input: string | undefined) => parseAndValidateNumber(input || now.day.toString(), 1, 31),
    month: (input: string | undefined) => parseAndValidateNumber(input || now.month.toString(), 1, 12),
    weekday: (input: string | undefined) =>
      input ? dayNames.indexOf(input.toLowerCase()) : now.weekday - 1,
  };

  const scheduleTypes = {
    hourly: async () => {
      const minute = parseAndValidateNumber(params[0], 0, 59) ?? now.minute;
      if (minute === null) return send('Phút không hợp lệ, hãy nhập số từ 0 đến 59');
      await updateSchedule(send, type, event, ['hourly', `${minute}`], `Lịch chạy hàng giờ vào phút ${minute}`);
    },
    daily: async () => {
      const time = validators.time(params[0]);
      if (!time) return send('Thời gian không hợp lệ, hãy nhập theo định dạng HH:mm');
      await updateSchedule(send, type, event, ['daily', time], `Lịch chạy hàng ngày vào lúc ${time}`);
    },
    weekly: async () => {
      const day = validators.weekday(params[0]);
      const time = validators.time(params[1]);
      if (day < 0 || day > 6) return send(`Ngày không hợp lệ, các giá trị hợp lệ: ${dayNames.join(', ')}`);
      if (!time) return send('Thời gian không hợp lệ, hãy nhập theo định dạng HH:mm');
      await updateSchedule(send, type, event, ['weekly', time, day], `Lịch chạy hàng tuần vào ${dayNames[day]} lúc ${time}`);
    },
    monthly: async () => {
      const day = validators.day(params[0]);
      const time = validators.time(params[1]);
      if (!day) return send('Ngày không hợp lệ, hãy nhập số từ 1 đến 31');
      if (!time) return send('Thời gian không hợp lệ, hãy nhập theo định dạng HH:mm');
      await updateSchedule(send, type, event, ['monthly', time, day], `Lịch chạy hàng tháng vào ngày ${day} lúc ${time}`);
    },
    yearly: async () => {
      const month = validators.month(params[0]);
      const day = validators.day(params[1]);
      const time = validators.time(params[2]);
      if (!month) return send('Tháng không hợp lệ, hãy nhập số từ 1 đến 12');
      if (!day) return send('Ngày không hợp lệ, hãy nhập số từ 1 đến 31');
      if (!time) return send('Thời gian không hợp lệ, hãy nhập theo định dạng HH:mm');
      await updateSchedule(send, type, event, ['yearly', time, day, month], `Lịch chạy hàng năm vào ngày ${day} tháng ${month} lúc ${time}`);
    },
    clear: async () => {
      await updateSchedule(send, type, event, [], 'Đã xóa lịch chạy');
    },
    show: async () => {
      const config = await utils.readConfig();
      const schedule = config.customerCare.schedule.data;
      if (!schedule.length) return send('Chưa thiết lập lịch chạy');
      const [frequency, ...details] = schedule;

      const messages: Record<string, string> = {
        hourly: `Lịch chạy hàng giờ vào phút thứ ${details[0]}`,
        daily: `Lịch chạy hàng ngày vào lúc ${details[0]}`,
        weekly: `Lịch chạy hàng tuần vào ${dayNames[details[1]!]} lúc ${details[0]}`,
        monthly: `Lịch chạy hàng tháng vào ngày ${details[1]} lúc ${details[0]}`,
        yearly: `Lịch chạy hàng năm vào ngày ${details[1]} tháng ${details[2]} lúc ${details[0]}`,
      };

      await send(messages[frequency]);
    },
  };

  if (scheduleTypes[subCommand as keyof typeof scheduleTypes]) {
    await scheduleTypes[subCommand as keyof typeof scheduleTypes]();
  } else {
    send('Lệnh không hợp lệ, xem hướng dẫn tại /help schedule');
  }
}

/**
 * Main command handler for scheduling.
 */
export default async function command({ send, args, event }: ModuleProps) {
  if (!args.length) return send('Vui lòng thiết lập lịch theo đúng cú pháp');
  const [subCommand, ...subArgs] = args;
  const validTypes: ScheduleType[] = ['cskh', 'poll'];

  if (validTypes.includes(subCommand as ScheduleType)) {
    return handleSchedule(send, subCommand as ScheduleType, event, subArgs);
  }
  send('Lệnh không hợp lệ, xem hướng dẫn tại /help schedule');
}
