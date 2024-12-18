import type { ModuleProps } from "../types";
import { readConfig } from "../utils";

export default async function command({ send, args }: ModuleProps) {
  const config = await readConfig();
  const defaultContent = `» Với trường <args> là bắt buộc, [args] là tùy chọn\n`;
  const helpCommands = {
    main: [
      `» ${config.prefix}cskh <args>: Gửi tin nhắn CSKH (có thể kèm ảnh)`,
      `» ${config.prefix}help: Hiển thị danh sách lệnh`,
      `» ${config.prefix}run <code>: Chạy mã JavaScript`,
      `» ${config.prefix}poll <args>: Tạo cuộc thăm dò`,
      `» ${config.prefix}schedule <frequency> [time]: Lập lịch CSKH`,
      `» ${config.prefix}uid: Hiển thị UID của bạn`,
      `» ${config.prefix}uptime: Thời gian hoạt động của bot`,
      `» ${config.prefix}xlsx <args> [range]: Đọc danh sách SĐT KH từ file Excel`,
    ],
    cskh: [
      `» ${config.prefix}cskh <nội dung>: Gửi tin nhắn CSKH`,
      `» ${config.prefix}cskh template list: Hiển thị danh sách mẫu tin nhắn`,
      `» ${config.prefix}cskh template send [id]: Gửi tin nhắn theo mẫu`,
      `» ${config.prefix}cskh template new <content>: Tạo mẫu tin nhắn`,
      `» ${config.prefix}cskh template <choose/select> <id>: Chọn mẫu mặc định`,
      `» ${config.prefix}cskh template <delete/rm> <id>: Xóa mẫu tin nhắn`,
      `» ${config.prefix}cskh delay <seconds>: Điều chỉnh tốc độ gửi tin nhắn`,
    ],
    xlsx: [
      `» ${config.prefix}xlsx <path> [range]: Đọc SĐT từ file Excel`,
      `» ${config.prefix}xlsx load [range]: Đọc SĐT từ file tạm hoặc tin nhắn`,
      `» ${config.prefix}xlsx clear: Xóa danh sách SĐT KH`,
      `» ${config.prefix}xlsx list: Hiển thị danh sách SĐT KH`,
    ],
    poll: [
      `» ${config.prefix}poll <args>: Tạo cuộc thăm dò`,
      `» ${config.prefix}poll create <nội dung>: Tạo cuộc thăm dò`,
      `» ${config.prefix}poll delete <id>: Xóa cuộc thăm dò`,
      `» ${config.prefix}poll list: Hiển thị danh sách id cuộc thăm dò`,
    ],
    run: [`» ${config.prefix}run <code>: Chạy mã JavaScript`],
    uid: [`» ${config.prefix}uid: Hiển thị UID của bạn`],
    uptime: [`» ${config.prefix}uptime: Thời gian hoạt động của bot`],
    schedule: [
      `» ${config.prefix}schedule <type> <frequency> [...time]: Lập lịch CSKH/POLL`,
      `» Ví dụ: ${config.prefix}schedule cskh hourly 30`,
      `» ${config.prefix}schedule poll daily 09:00`,
      `» ${config.prefix}schedule cskh monthly 12 09:00`,
      `» ${config.prefix}schedule poll yearly 12 12 09:00`,
    ],
  };

  const invalidCommandMsg = `Lệnh không hợp lệ, sử dụng ${config.prefix}help để xem danh sách lệnh`;

  if (args.length === 0) return send(helpCommands.main.join('\n'));

  const category = helpCommands[args[0] as keyof typeof helpCommands] || [];
  if (category.length) return send(`${defaultContent}${category.join('\n')}`);

  return send(invalidCommandMsg);
}
