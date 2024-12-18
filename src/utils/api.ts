import { MessageType, type API, type Message, type MessageContent } from "zca-js";
import { readConfig, writeConfig } from "../utils";

export const getUserID = async (api: API, phone_number: string): Promise<string | null> => {
  const config = await readConfig();
  if (config.knownPhoneNumbers[phone_number]) {
    return config.knownPhoneNumbers[phone_number];
  } else {
    try {
      const user = await api.findUser(phone_number);
      config.knownPhoneNumbers[phone_number] = user.uid;
      await writeConfig(config);
      return user.uid;
    } catch {
      return null;
    }
  }
}

export const getSendMessage = (api: API, event: Message) => (input: string | MessageContent, quote: boolean = true) => {
  let msg: string | MessageContent = input;
  if (typeof input === 'string') {
    msg = input;
    if (quote) {
      msg = { msg: input, quote: event };
    }
  } else {
    msg = input;
    if (quote) {
      msg = { ...input, quote: event };
    }
  }
  return api.sendMessage(msg, event.threadId, event.type === MessageType.DirectMessage ? MessageType.DirectMessage : MessageType.GroupMessage);
}