/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename message.model.ts                                                   │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Dez 07, 2023                                                  │
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
 * │                                                                              │                                                        │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

export type RichText = {
  type: string;
  text: string;
  bold: boolean;
  italic: boolean;
  children: {
    bold: boolean;
    italic: boolean;
    text: string;
    type: string;
    children: RichText[];
  }[];
};

export type Content = {
  richText: RichText[];
  url?: string;
  id?: string;
  type?: string;
  height?: number;
  aspectRatio?: string;
  maxWidth?: string;
};

export type ResponseMessage = {
  id: string;
  type: string;
  content: Content;
};

export type Input = {
  id: string;
  type: string;
  options: {
    labels: {
      placeholder: string;
    };
  };
};

export type Typebot = {
  id: string;
  theme: object;
  settings: object;
};

export type Response = {
  messages: ResponseMessage[];
  input: Input;
  sessionId: string;
  typebot: Typebot;
  resultId: string;
  code: string;
} & SessionNotFound;

export type SessionNotFound = {
  message: string;
  code: string;
};
