/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename sendMessage.controller.ts                                          │
 * │ Developed by: Cleber Wilson                                                  │
 * │ Creation date: Jul 17, 2022                                                  │
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
 * │ @class                                                                       │
 * │ @constructs SendMessageController                                            │
 * │ @param {WAMonitoringService} waMonit                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { isBase64, isNumberString, isURL } from 'class-validator';
import { BadRequestException } from '../../exceptions';
import { InstanceDto } from '../dto/instance.dto';
import {
  AudioMessageFileDto,
  MediaFileDto,
  SendAudioDto,
  SendButtonsDto,
  SendContactDto,
  SendLinkDto,
  SendListDto,
  SendListLegacyDto,
  SendLocationDto,
  SendMediaDto,
  SendReactionDto,
  SendTextDto,
} from '../dto/sendMessage.dto';
import { WAMonitoringService } from '../services/monitor.service';

export class SendMessageController {
  constructor(private readonly waMonitor: WAMonitoringService) {}

  public async sendText({ instanceName }: InstanceDto, data: SendTextDto) {
    return await this.waMonitor.waInstances.get(instanceName).textMessage(data);
  }

  public async sendMedia({ instanceName }: InstanceDto, data: SendMediaDto) {
    if (isBase64(data?.mediaMessage?.media)) {
      throw new BadRequestException('Owned media must be a url');
    }
    if (data.mediaMessage.mediatype === 'document' && !data.mediaMessage?.fileName) {
      throw new BadRequestException(
        'The "fileName" property must be provided for documents',
      );
    }
    if (isURL(data?.mediaMessage?.media as string)) {
      return await this.waMonitor.waInstances.get(instanceName).mediaMessage(data);
    }
  }

  public async sendMediaFile(
    { instanceName }: InstanceDto,
    data: MediaFileDto,
    fileName: string,
  ) {
    if (data?.delay && !isNumberString(data.delay)) {
      throw new BadRequestException('The "delay" property must have an integer.');
    } else {
      data.delay = Number.parseInt(data?.delay as never);
    }
    return await this.waMonitor.waInstances
      .get(instanceName)
      .mediaFileMessage(data, fileName);
  }

  public async sendWhatsAppAudio({ instanceName }: InstanceDto, data: SendAudioDto) {
    if (isBase64(data?.audioMessage.audio)) {
      throw new BadRequestException('Owned media must be a url');
    }
    if (!isURL(data.audioMessage.audio, { protocols: ['http', 'https'] })) {
      throw new BadRequestException('Unknown error');
    }

    return await this.waMonitor.waInstances.get(instanceName).audioWhatsapp(data);
  }

  public async sendWhatsAppAudioFile(
    { instanceName }: InstanceDto,
    data: AudioMessageFileDto,
    fileName: string,
  ) {
    if (data?.delay && !isNumberString(data.delay)) {
      throw new BadRequestException('The "delay" property must have an integer.');
    } else {
      data.delay = Number.parseInt(data?.delay as never);
    }
    if (data?.convertAudio) {
      data.convertAudio = data.convertAudio === 'true';
    }
    return await this.waMonitor.waInstances
      .get(instanceName)
      .audioWhatsAppFile(data, fileName);
  }

  public async sendLocation({ instanceName }: InstanceDto, data: SendLocationDto) {
    return await this.waMonitor.waInstances.get(instanceName).locationMessage(data);
  }

  public async sendContact({ instanceName }: InstanceDto, data: SendContactDto) {
    return await this.waMonitor.waInstances.get(instanceName).contactMessage(data);
  }

  public async sendReaction({ instanceName }: InstanceDto, data: SendReactionDto) {
    if (!data.reactionMessage.reaction.match(/[^()\w\sà-ú"-+]+/)) {
      throw new BadRequestException('"reaction" must be an emoji');
    }
    return await this.waMonitor.waInstances.get(instanceName).reactionMessage(data);
  }

  // public async sendButtons({ instanceName }: InstanceDto, data: SendButtonsDto) {
  //   return await this.waMonitor.waInstances.get(instanceName).buttonsMessage(data);
  // }

  // public async sendList({ instanceName }: InstanceDto, data: SendListDto) {
  //   return await this.waMonitor.waInstances.get(instanceName).listButtons(data);
  // }

  // public async sendListLegacy({ instanceName }: InstanceDto, data: SendListLegacyDto) {
  //   return await this.waMonitor.waInstances.get(instanceName).listLegacy(data);
  // }

  public async sendLinkPreview({ instanceName }: InstanceDto, data: SendLinkDto) {
    return await this.waMonitor.waInstances.get(instanceName).linkMessage(data);
  }
}
