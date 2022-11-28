import { ArchiveChatDto, ReadMessageDto, WhatsAppNumberDto } from '../dto/chat.dto';
import { InstanceDto } from '../dto/instance.dto';
import { ContactQuery } from '../repository/contact.repository';
import { MessageQuery } from '../repository/message.repository';
import { MessageUpQuery } from '../repository/messageUp.repository';
import { WAMonitoringService } from '../services/monitor.service';

export class ChatController {
  constructor(private readonly waMonitor: WAMonitoringService) {}

  public async whatsappNumber({ instanceName }: InstanceDto, data: WhatsAppNumberDto) {
    return await this.waMonitor.waInstances[instanceName].whatsappNumber(data);
  }

  public async readMessage({ instanceName }: InstanceDto, data: ReadMessageDto) {
    return await this.waMonitor.waInstances[instanceName].markMessageAsRead(data);
  }

  public async archiveChat({ instanceName }: InstanceDto, data: ArchiveChatDto) {
    return await this.waMonitor.waInstances[instanceName].archiveChat(data);
  }

  public async fetchContacts({ instanceName }: InstanceDto, query: ContactQuery) {
    query.where.instanceName = instanceName;
    return await this.waMonitor.waInstances[instanceName].fetchContacts(query);
  }

  public async fetchMessages({ instanceName }: InstanceDto, query: MessageQuery) {
    query.where.instanceName = instanceName;
    return await this.waMonitor.waInstances[instanceName].fetchMessages(query);
  }

  public async fetchStatusMessage({ instanceName }: InstanceDto, query: MessageUpQuery) {
    query.where.instanceName = instanceName;
    return await this.waMonitor.waInstances[instanceName].findStatusMessage(query);
  }
}
