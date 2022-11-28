import { isBase64, isURL } from 'class-validator';
import { BadRequestException } from '../../exceptions';
import { InstanceDto } from '../dto/instance.dto';
import {
  SendButtonDto,
  SendContactDto,
  SendListDto,
  SendLocationDto,
  SendMediaDto,
  SendReactionDto,
  SendTextDto,
} from '../dto/sendMessage.dto';
import { WAMonitoringService } from '../services/monitor.service';

export class SendMessageController {
  constructor(private readonly waMonitor: WAMonitoringService) {}

  public async sendText({ instanceName }: InstanceDto, data: SendTextDto) {
    return await this.waMonitor.waInstances[instanceName].textMessage(data);
  }

  public async sendMedia({ instanceName }: InstanceDto, data: SendMediaDto) {
    if (!isURL(data?.mediaMessage?.media) || !isBase64(data?.mediaMessage?.media)) {
      throw new BadRequestException('Owned media must be a url or base64');
    }
    return await this.waMonitor.waInstances[instanceName].mediaMessage(data);
  }

  public async sendButtons({ instanceName }: InstanceDto, data: SendButtonDto) {
    return await this.waMonitor.waInstances[instanceName].buttonMessage(data);
  }

  public async sendLocation({ instanceName }: InstanceDto, data: SendLocationDto) {
    return await this.waMonitor.waInstances[instanceName].locationMessage(data);
  }

  public async sendList({ instanceName }: InstanceDto, data: SendListDto) {
    return await this.waMonitor.waInstances[instanceName].listMessage(data);
  }

  public async sendContact({ instanceName }: InstanceDto, data: SendContactDto) {
    return await this.waMonitor.waInstances[instanceName].contactMessage(data);
  }

  public async sendReaction({ instanceName }: InstanceDto, data: SendReactionDto) {
    if (!data.reactionMessage.reaction.match(/[^\(\)\w\sà-ú"-\+]+/)) {
      throw new BadRequestException('"reaction" must be an emoji');
    }
    return await this.waMonitor.waInstances[instanceName].reactionMessage(data);
  }
}
