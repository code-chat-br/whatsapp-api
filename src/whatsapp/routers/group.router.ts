/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author jrCleber                                                             │
 * │ @filename group.router.ts                                                    │
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
 * │ @class                                                                       │
 * │ @constructs GroupRouter @extends RouterBroker                                │
 * │ @param {RequestHandler[]} guards                                             │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @important                                                                   │
 * │ For any future changes to the code in this file, it is recommended to        │
 * │ contain, together with the modification, the information of the developer    │
 * │ who changed it and the date of modification.                                 │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { RequestHandler, Router } from 'express';
import {
  createGroupSchema,
  groupJidSchema,
  updateParticipantsSchema,
  updateGroupPicture,
} from '../../validate/validate.schema';
import {
  CreateGroupDto,
  GroupJid,
  GroupPictureDto,
  GroupUpdateParticipantDto,
} from '../dto/group.dto';
import { HttpStatus } from '../../app.module';
import { GroupController } from '../controllers/group.controller';
import { routerPath, dataValidate, groupValidate } from '../../validate/router.validate';

export function GroupRouter(
  groupController: GroupController,
  ...guards: RequestHandler[]
) {
  const router = Router()
    .post(routerPath('create'), ...guards, async (req, res) => {
      const response = await dataValidate<CreateGroupDto>({
        request: req,
        schema: createGroupSchema,
        execute: (instance, data) => groupController.createGroup(instance, data),
      });

      res.status(HttpStatus.CREATED).json(response);
    })
    .put(routerPath('updateGroupPicture'), ...guards, async (req, res) => {
      const response = await groupValidate<GroupPictureDto>({
        request: req,
        schema: updateGroupPicture,
        execute: (instance, data) => groupController.updateGroupPicture(instance, data),
      });

      res.status(HttpStatus.CREATED).json(response);
    })
    .get(routerPath('findGroupInfos'), ...guards, async (req, res) => {
      const response = await groupValidate<GroupJid>({
        request: req,
        schema: groupJidSchema,
        execute: (instance, data) => groupController.findGroupInfo(instance, data),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('findAllGroups'), ...guards, async (req, res) => {
      const params = req.params;
      const response = await groupController.allGroups({
        instanceName: params?.instanceName as unknown as string,
      });
      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('participants'), ...guards, async (req, res) => {
      const response = await groupValidate<GroupJid>({
        request: req,
        schema: groupJidSchema,
        execute: (instance, data) => groupController.findParticipants(instance, data),
      });

      res.status(HttpStatus.OK).json(response);
    })
    .get(routerPath('inviteCode'), ...guards, async (req, res) => {
      const response = await groupValidate<GroupJid>({
        request: req,
        schema: groupJidSchema,
        execute: (instance, data) => groupController.inviteCode(instance, data),
      });

      res.status(HttpStatus.OK).json(response);
    })

    .put(routerPath('revokeInviteCode'), ...guards, async (req, res) => {
      const response = await groupValidate<GroupJid>({
        request: req,
        schema: groupJidSchema,
        execute: (instance, data) => groupController.revokeInviteCode(instance, data),
      });

      res.status(HttpStatus.CREATED).json(response);
    })
    .put(routerPath('updateParticipant'), ...guards, async (req, res) => {
      const response = await groupValidate<GroupUpdateParticipantDto>({
        request: req,
        schema: updateParticipantsSchema,
        execute: (instance, data) => groupController.updateGParticipate(instance, data),
      });

      res.status(HttpStatus.CREATED).json(response);
    })
    .delete(routerPath('leaveGroup'), ...guards, async (req, res) => {
      const response = await groupValidate<GroupJid>({
        request: req,
        schema: {},
        execute: (instance, data) => groupController.leaveGroup(instance, data),
      });

      res.status(HttpStatus.OK).json(response);
    });

  return router;
}
