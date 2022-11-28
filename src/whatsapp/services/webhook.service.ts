import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ROOT_DIR } from '../../config/path.config';
import { InstanceDto } from '../dto/instance.dto';
import { WebhookDto } from '../dto/webhook.dto';
import { WAMonitoringService } from './monitor.service';

export class WebhookService {
  constructor(private readonly waMonitor: WAMonitoringService) {}
  private readonly store = join(ROOT_DIR, 'store', 'webhook');

  public create(instance: InstanceDto, data: WebhookDto) {
    writeFileSync(join(this.store, instance.instanceName), JSON.stringify(data), {
      encoding: 'utf-8',
    });

    this.waMonitor.waInstances[instance.instanceName].setWebhook(data);

    return { webhook: { ...instance, webhook: data } };
  }

  public find(instance: InstanceDto): WebhookDto {
    try {
      const webhook = JSON.parse(
        readFileSync(join(this.store, instance.instanceName + '.json'), {
          encoding: 'utf-8',
        }),
      ) as WebhookDto;

      return webhook;
    } catch (error) {
      return { enabled: null, url: '' };
    }
  }
}
