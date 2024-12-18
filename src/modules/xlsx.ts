import { fileExists, getFile, isValidExcelFile, readConfig, readPhoneData, writeConfig } from '../utils';

import type { ModuleProps } from '../types';

export default async function command({ send, args, event }: ModuleProps) {
  const path = args[0];
  const range = args[1] || 'A1:A1000';

  const config = await readConfig();

  const handlePhoneData = async (filePath: string) => {
    if (!await fileExists(filePath)) return 'File không hợp lệ';

    try {
      const phoneData = await readPhoneData(filePath, range);
      if (phoneData.length === 0) return 'Không tìm thấy SĐT';
      let phoneDataLower = phoneData.map(p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k.toLowerCase(), v])));

      if (!phoneDataLower[0]['phone']) return 'Không tìm thấy cột Phone';

      config.customerCare.phoneNumbers = [...new Set(phoneDataLower.map(p => p['phone']))];
      await writeConfig(config);
      return `Đã lưu ${phoneData.length} SĐT KH`;
    } catch {
      return 'Lỗi đọc file';
    }
  };

  if (!path) return send('Vui lòng nhập đường dẫn đến file SĐT');

  if (path === 'load') {
    let exists = await fileExists('temp/phone.xlsx');

    if (!exists && !event.data.quote) {
      return send('Vui lòng reply tin nhắn chứa file SĐT');
    }

    if (event.data.quote) {
      const { title, href } = JSON.parse(event.data.quote.attach) as { title: string, href: string };
      if (!title.includes('.xlsx')) return send('File không hợp lệ');
      await getFile(href, 'phone.xlsx');
    }
    return send(await handlePhoneData('temp/phone.xlsx'));
  }

  if (path === 'clear') {
    config.customerCare.phoneNumbers = [];
    await writeConfig(config);
    return send('Đã xóa danh sách SĐT KH');
  }

  if (path === 'list') {
    if (config.customerCare.phoneNumbers && config.customerCare.phoneNumbers.length > 0) {
      const phoneList = config.customerCare.phoneNumbers.map((phone, index) => `${index + 1}. ${phone}`).join('\n');
      return send(`Danh sách SĐT KH:\n${phoneList}`);
    } else {
      return send('Danh sách SĐT KH rỗng');
    }
  }

  if (!isValidExcelFile(path)) return send('File không hợp lệ');
  return send(await handlePhoneData(path));
}