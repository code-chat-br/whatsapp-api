import { Schema } from 'mongoose';
import { dbserver } from '../../db/db.connect';

export class ChatRaw {
  _id?: string;
  id?: string;
  isnatnceName: string;
}

const chatSchema = new Schema({
  id: { type: String, required: true, minlength: 1 },
  instanceName: { type: String, required: true, minlength: 1 },
});

export const ChatModel = dbserver?.model(ChatRaw.name, chatSchema, 'chats');
export type IChatModel = typeof ChatModel;
