/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename group.controller.ts                                                │
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
 * │ @constructs ViewsController                                                  │
 * │ @param {WAMonitoringService} waMonit                                         │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import {
  CreateGroupDto,
  GroupJid,
  GroupPictureDto,
  GroupUpdateParticipantDto,
} from '../dto/group.dto';
import { InstanceDto } from '../dto/instance.dto';
import { WAMonitoringService } from '../services/monitor.service';

export class GroupController {
  constructor(private readonly waMonitor: WAMonitoringService) {}

  public async createGroup({ instanceName }: InstanceDto, create: CreateGroupDto) {
    return await this.waMonitor.waInstances.get(instanceName).createGroup(create);
  }

  public async updateGroupPicture(
    { instanceName }: InstanceDto,
    update: GroupPictureDto,
  ) {
    return await this.waMonitor.waInstances.get(instanceName).updateGroupPicture(update);
  }

  public async findGroupInfo({ instanceName }: InstanceDto, groupJid: GroupJid) {
    return await this.waMonitor.waInstances.get(instanceName).findGroup(groupJid);
  }

  public async allGroups({ instanceName }: InstanceDto) {
    return await this.waMonitor.waInstances.get(instanceName).findAllGroups();
  }

  public async inviteCode({ instanceName }: InstanceDto, groupJid: GroupJid) {
    return await this.waMonitor.waInstances.get(instanceName).invitationCode(groupJid);
  }

  public async revokeInviteCode({ instanceName }: InstanceDto, groupJid: GroupJid) {
    return await this.waMonitor.waInstances
      .get(instanceName)
      .revokeInvitationCode(groupJid);
  }

  public async findParticipants({ instanceName }: InstanceDto, groupJid: GroupJid) {
    return await this.waMonitor.waInstances.get(instanceName).findParticipants(groupJid);
  }

  public async updateGParticipate(
    { instanceName }: InstanceDto,
    update: GroupUpdateParticipantDto,
  ) {
    return await this.waMonitor.waInstances.get(instanceName).updateGParticipant(update);
  }

  public async leaveGroup({ instanceName }: InstanceDto, groupJid: GroupJid) {
    return await this.waMonitor.waInstances.get(instanceName).leaveGroup(groupJid);
  }
}
