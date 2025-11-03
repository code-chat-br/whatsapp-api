/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename message.model.ts                                                   │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Dez 05, 2023                                                  │
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
 * │ @class S3Controller                                                          │                                                          │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { BadRequestException } from '../../exceptions';
import { MediaDto } from '../../whatsapp/dto/media.dto';
import { getObjectUrl } from './minio.utils';
import { Repository } from '../../repository/repository.service';

export class S3Service {
  constructor(private readonly repository: Repository) {}

  public async getMedia(query?: MediaDto) {
    try {
      const media = await this.repository.media.findMany({
        where: query as never,
        select: {
          id: true,
          fileName: true,
          type: true,
          mimetype: true,
          createdAt: true,
          Message: true,
        },
      });

      if (!media || media.length === 0) {
        throw 'Media not found';
      }

      return media;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  public async getMediaUrl(id: string, expiry?: number) {
    const mediaId = Number.parseInt(id);
    const media = (await this.getMedia({ id: mediaId }))[0];
    const mediaUrl = await getObjectUrl(media.fileName, expiry);
    return {
      mediaUrl,
      ...media,
    };
  }
}
