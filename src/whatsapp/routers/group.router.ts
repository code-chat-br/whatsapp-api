import { RequestHandler, Router } from 'express';
import {
  createGroupSchema,
  groupJidSchema,
  updateGparticipantsSchema,
} from '../../validate/validate.schema';
import { RouterBroker } from '../abstract/abstract.router';
import { CreateGroupDto, GroupJid, GroupUpdateParticipantDto } from '../dto/group.dto';
import { groupController } from '../whatsapp.module';
import { HttpStatus } from './index.router';

export class GroupRouter extends RouterBroker {
  constructor(...guards: RequestHandler[]) {
    super();
    this.router
      .post(this.routerPath('create'), ...guards, async (req, res) => {
        const response = await this.dataValidate<CreateGroupDto>({
          request: req,
          schema: createGroupSchema,
          ClassRef: CreateGroupDto,
          execute: (instance, data) => groupController.createGroup(instance, data),
        });

        res.status(HttpStatus.CREATED).json(response);
      })
      .get(this.routerPath('findGroupInfos'), ...guards, async (req, res) => {
        const response = await this.groupValidate<GroupJid>({
          request: req,
          schema: groupJidSchema,
          ClassRef: GroupJid,
          execute: (instance, data) => groupController.findGroupInfo(instance, data),
        });

        res.status(HttpStatus.OK).json(response);
      })
      .get(this.routerPath('participants'), ...guards, async (req, res) => {
        const response = await this.groupValidate<GroupJid>({
          request: req,
          schema: groupJidSchema,
          ClassRef: GroupJid,
          execute: (instance, data) => groupController.findParticipnats(instance, data),
        });

        res.status(HttpStatus.OK).json(response);
      })
      .get(this.routerPath('inviteCode'), ...guards, async (req, res) => {
        const response = await this.groupValidate<GroupJid>({
          request: req,
          schema: groupJidSchema,
          ClassRef: GroupJid,
          execute: (instance, data) => groupController.inviteCode(instance, data),
        });

        res.status(HttpStatus.OK).json(response);
      })

      .put(this.routerPath('revokeInviteCode'), ...guards, async (req, res) => {
        const response = await this.groupValidate<GroupJid>({
          request: req,
          schema: groupJidSchema,
          ClassRef: GroupJid,
          execute: (instance, data) => groupController.revokeInviteCode(instance, data),
        });

        res.status(HttpStatus.CREATED).json(response);
      })
      .put(this.routerPath('updateParticipant'), ...guards, async (req, res) => {
        const response = await this.groupValidate<GroupUpdateParticipantDto>({
          request: req,
          schema: updateGparticipantsSchema,
          ClassRef: GroupUpdateParticipantDto,
          execute: (instance, data) => groupController.revokeInviteCode(instance, data),
        });

        res.status(HttpStatus.CREATED).json(response);
      })
      .delete(this.routerPath('leaveGroup'), ...guards, async (req, res) => {
        const response = await this.groupValidate<GroupJid>({
          request: req,
          schema: updateGparticipantsSchema,
          ClassRef: GroupJid,
          execute: (instance, data) => groupController.revokeInviteCode(instance, data),
        });

        res.status(HttpStatus.OK).json(response);
      });
  }

  public readonly router = Router();
}
