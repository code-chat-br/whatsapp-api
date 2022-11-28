import { Schema } from 'mongoose';
import { dbserver } from '../../db/db.connect';

export class ContactRaw {
  _id?: string;
  pushName?: string;
  id?: string;
  profilePictureUrl?: string;
  instanceName: string;
}

const contactSchema = new Schema({
  pushName: { type: String, minlength: 1 },
  id: { type: String, required: true, minlength: 1 },
  profilePictureUrl: { type: String, minlength: 1 },
});

export const ContactModel = dbserver?.model(ContactRaw.name, contactSchema, 'contacts');
export type IContactModel = typeof ContactModel;
