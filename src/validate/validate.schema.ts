/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename validate.schema.ts                                                 │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Nov 27, 2022                                                  │
 * │ Contact: contato@codechat.dev                                                │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Cleber Wilson 2022. All rights reserved.                        │
 * │ Licensed under the Apache License, Version 2.0                               │
 * │                                                                              │
 * │  @license "https://github.com/code-chat-br/whatsapp-api/blob/main/LICENSE"   │
 * │                                                                              │
 * │ You may not use this file except in compliance with the License.             │
 * │ You may obtain a copy of the License at                                      │
 * │                                                                              │
 * │    http://www.apache.org/licenses/LICENSE-2.0                                │
 * │                                                                              │
 * │ Unless required by applicable law or agreed to in writing, software          │
 * │ distributed under the License is distributed on an "AS IS" BASIS,            │
 * │ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     │
 * │                                                                              │
 * │ See the License for the specific language governing permissions and          │
 * │ limitations under the License.                                               │
 * │                                                                              │
 * │ @constant isNotEmpty @constant instanceNameSchema                            │
 * │ @constant optionsSchema @constant numberDefinition                           │
 * │ @constant textMessageSchema @constant mediaMessageSchema                     │
 * │ @constant locationMessageSchema @constant mediaFileMessageSchema             │
 * │ @constant contactMessageSchema @constant reactionMessageSchema               │
 * │ @constant whatsappNumberSchema @constant readMessageSchema                   │
 * │ @constant archiveChatSchema @constant deleteMessageSchema                    │
 * │ @constant contactValidateSchema @constant profilePictureSchema               │
 * │ @constant messageValidateSchema @constant messageUpSchema                    │
 * │ @constant createGroupSchema @constant groupJidSchema                         │
 * │ @constant updateParticipantsSchema @constant updateGroupPicture              │
 * │ @constant webhookSchema @constant oldTokenSchema                             │
 * │ @constant audioMessageSchema                                                 │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { v4 } from 'uuid';

const isNotEmpty = (...propertyNames: string[]): JSONSchema7 => {
  const properties = {};
  propertyNames.forEach(
    (property) =>
      (properties[property] = {
        minLength: 1,
        description: `The "${property}" cannot be empty`,
      }),
  );
  return {
    if: {
      propertyNames: {
        enum: [...propertyNames],
      },
    },
    then: { properties },
  };
};

// Instance Schema
export const instanceNameSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    instanceName: { type: 'string' },
  },
  ...isNotEmpty('instanceName'),
};

export const oldTokenSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    oldToken: { type: 'string' },
  },
  required: ['oldToken'],
  ...isNotEmpty('oldToken'),
};

// Send Message Schema
const optionsSchema: JSONSchema7 = {
  properties: {
    delay: {
      type: 'integer',
      description: 'Enter a value in milliseconds',
    },
    presence: {
      type: 'string',
      enum: ['unavailable', 'available', 'composing', 'recording', 'paused'],
    },
  },
};

const numberDefinition: JSONSchema7Definition = {
  type: 'string',
  pattern: '^\\d+[\\.@\\w-]+',
  description: 'Invalid format',
};

export const textMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    number: { ...numberDefinition },
    options: { ...optionsSchema },
    textMessage: {
      type: 'object',
      properties: {
        text: { type: 'string' },
      },
      required: ['text'],
      ...isNotEmpty('text'),
    },
  },
  required: ['textMessage', 'number'],
};

export const mediaMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    number: { ...numberDefinition },
    options: { ...optionsSchema },
    mediaMessage: {
      type: 'object',
      properties: {
        mediatype: { type: 'string', enum: ['image', 'document', 'video', 'audio'] },
        media: { type: 'string' },
        fileName: { type: 'string' },
        caption: { type: 'string' },
      },
      required: ['mediatype', 'media'],
      ...isNotEmpty('fileName', 'caption', 'media'),
    },
  },
  required: ['mediaMessage', 'number'],
};

export const mediaFileMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    number: { ...numberDefinition },
    caption: { type: 'string' },
    mediatype: { type: 'string', enum: ['image', 'document', 'video', 'audio'] },
    presence: { type: 'string', enum: ['composing', 'recording'] },
    delay: { type: 'string' },
  },
  required: ['mediatype', 'number'],
  ...isNotEmpty('caption', 'mediatype', 'number', 'delay', 'presence'),
};

export const audioMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    number: { ...numberDefinition },
    options: { ...optionsSchema },
    audioMessage: {
      type: 'object',
      properties: {
        audio: { type: 'string' },
      },
      required: ['audio'],
      ...isNotEmpty('audio'),
    },
  },
  required: ['audioMessage', 'number'],
};

export const audioFileMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    number: { ...numberDefinition },
    delay: { type: 'string' },
  },
  required: ['number'],
  ...isNotEmpty('delay'),
};

export const locationMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    number: { ...numberDefinition },
    options: { ...optionsSchema },
    locationMessage: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        name: { type: 'string' },
        address: { type: 'string' },
      },
      required: ['latitude', 'longitude'],
      ...isNotEmpty('name', 'address'),
    },
  },
  required: ['number', 'locationMessage'],
};

export const contactMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    number: { ...numberDefinition },
    options: { ...optionsSchema },
    contactMessage: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          wuid: {
            type: 'string',
            minLength: 10,
            pattern: '\\d+',
            description: '"wuid" must be a numeric string',
          },
          phoneNumber: { type: 'string', minLength: 10 },
        },
        required: ['fullName', 'wuid', 'phoneNumber'],
        ...isNotEmpty('fullName'),
      },
      minItems: 1,
      uniqueItems: true,
    },
  },
  required: ['number', 'contactMessage'],
};

export const reactionMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    reactionMessage: {
      type: 'object',
      properties: {
        key: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            remoteJid: { type: 'string' },
            fromMe: { type: 'boolean', enum: [true, false] },
          },
          required: ['id', 'remoteJid', 'fromMe'],
          ...isNotEmpty('id', 'remoteJid'),
        },
        reaction: { type: 'string' },
      },
      required: ['key', 'reaction'],
      ...isNotEmpty('reaction'),
    },
  },
  required: ['reactionMessage'],
};

// Chat Schema
export const whatsappNumberSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    numbers: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string',
        pattern: '^\\d+',
        description: '"numbers" must be an array of numeric strings',
      },
    },
  },
};

export const readMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    readMessages: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        properties: {
          id: { type: 'string' },
          fromMe: { type: 'boolean', enum: [true, false] },
          remoteJid: { type: 'string' },
        },
        required: ['id', 'fromMe', 'remoteJid'],
        ...isNotEmpty('id', 'remoteJid'),
      },
    },
  },
  required: ['readMessages'],
};

export const archiveChatSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    lastMessage: {
      type: 'object',
      properties: {
        key: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            remoteJid: { type: 'string' },
            fromMe: { type: 'boolean', enum: [true, false] },
          },
          required: ['id', 'fromMe', 'remoteJid'],
          ...isNotEmpty('id', 'remoteJid'),
        },
        messageTimestamp: { type: 'integer', minLength: 1 },
      },
      required: ['key'],
      ...isNotEmpty('messageTimestamp'),
    },
    archive: { type: 'boolean', enum: [true, false] },
  },
  required: ['lastMessage', 'archive'],
};

export const deleteMessageSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    id: { type: 'string' },
    fromMe: { type: 'boolean', enum: [true, false] },
    remoteJid: { type: 'string' },
    participant: { type: 'string' },
  },
  required: ['id', 'fromMe', 'remoteJid'],
  ...isNotEmpty('id', 'remoteJid', 'participant'),
};

export const contactValidateSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    where: {
      type: 'object',
      properties: {
        _id: { type: 'string', minLength: 1 },
        pushName: { type: 'string', minLength: 1 },
        id: { type: 'string', minLength: 1 },
      },
      ...isNotEmpty('_id', 'id', 'pushName'),
    },
  },
};

export const profilePictureSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    number: { type: 'string' },
  },
  ...isNotEmpty('number'),
};

export const messageValidateSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    where: {
      type: 'object',
      properties: {
        _id: { type: 'string', minLength: 1 },
        key: {
          type: 'object',
          if: {
            propertyNames: {
              enum: ['fromMe', 'remoteJid', 'id'],
            },
          },
          then: {
            properties: {
              remoteJid: {
                type: 'string',
                minLength: 1,
                description: 'The property cannot be empty',
              },
              id: {
                type: 'string',
                minLength: 1,
                description: 'The property cannot be empty',
              },
              fromMe: { type: 'boolean', enum: [true, false] },
            },
          },
        },
        message: { type: 'object' },
      },
      ...isNotEmpty('_id'),
    },
    limit: { type: 'integer' },
  },
};

export const messageUpSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    where: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        remoteJid: { type: 'string' },
        id: { type: 'string' },
        fromMe: { type: 'boolean', enum: [true, false] },
        participant: { type: 'string' },
        status: {
          type: 'string',
          enum: ['ERROR', 'PENDING', 'SERVER_ACK', 'DELIVERY_ACK', 'READ', 'PLAYED'],
        },
      },
      ...isNotEmpty('_id', 'remoteJid', 'id', 'status'),
    },
    limit: { type: 'integer' },
  },
};

// Group Schema
export const createGroupSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    subject: { type: 'string' },
    description: { type: 'string' },
    profilePicture: { type: 'string' },
    participants: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string',
        minLength: 10,
        pattern: '\\d+',
        description: '"participants" must be an array of numeric strings',
      },
    },
  },
  required: ['subject', 'participants'],
  ...isNotEmpty('subject', 'description', 'profilePicture'),
};

export const groupJidSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    groupJid: { type: 'string', pattern: '^[\\d-]+@g.us$' },
  },
  required: ['groupJid'],
  ...isNotEmpty('groupJid'),
};

export const updateParticipantsSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    groupJid: { type: 'string' },
    action: {
      type: 'string',
      enum: ['add', 'remove', 'promote', 'demote'],
    },
    participants: {
      type: 'array',
      minItems: 1,
      uniqueItems: true,
      items: {
        type: 'string',
        minLength: 10,
        pattern: '\\d+',
        description: '"participants" must be an array of numeric strings',
      },
    },
  },
  required: ['groupJid', 'action', 'participants'],
  ...isNotEmpty('groupJid', 'action'),
};

export const updateGroupPicture: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    groupJid: { type: 'string' },
    image: { type: 'string' },
  },
  required: ['groupJid', 'image'],
  ...isNotEmpty('groupJid', 'image'),
};

// Webhook Schema
export const webhookSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    url: { type: 'string' },
    enabled: { type: 'boolean', enum: [true, false] },
  },
  required: ['url', 'enabled'],
  ...isNotEmpty('url'),
};
