/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author Pangeia Team                                                         │
 * │ @filename team.service.ts                                                    │
 * │ Developed by: Pangeia Task Management System                                 │
 * │ Creation date: Oct 24, 2025                                                  │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Pangeia 2025. All rights reserved.                              │
 * │ Licensed under the Apache License, Version 2.0                               │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { PrismaClient } from '@prisma/client';
import { CreateTeamDto, UpdateTeamDto, CreateTeamMemberDto, UpdateTeamMemberDto } from '../dto/team.dto';

export class TeamService {
  constructor(private readonly prisma: PrismaClient) {}

  // ================== TEAM OPERATIONS ==================

  async createTeam(data: CreateTeamDto) {
    return await this.prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        active: data.active ?? true,
      },
      include: {
        members: true,
      },
    });
  }

  async getTeamById(teamId: number) {
    return await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { active: true },
          orderBy: [{ role: 'asc' }, { name: 'asc' }],
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  async getTeamByName(name: string) {
    return await this.prisma.team.findUnique({
      where: { name },
      include: {
        members: {
          where: { active: true },
          orderBy: [{ role: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  async getAllTeams(activeOnly: boolean = true) {
    return await this.prisma.team.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: {
        members: {
          where: { active: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateTeam(teamId: number, data: UpdateTeamDto) {
    return await this.prisma.team.update({
      where: { id: teamId },
      data,
      include: {
        members: true,
      },
    });
  }

  async deleteTeam(teamId: number) {
    return await this.prisma.team.delete({
      where: { id: teamId },
    });
  }

  // ================== TEAM MEMBER OPERATIONS ==================

  async addMember(teamId: number, data: CreateTeamMemberDto) {
    return await this.prisma.teamMember.create({
      data: {
        teamId,
        whatsappJid: data.whatsappJid,
        name: data.name,
        role: data.role,
        active: data.active ?? true,
      },
      include: {
        team: true,
      },
    });
  }

  async getMemberById(memberId: number) {
    return await this.prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        team: true,
        assignedTasks: {
          include: {
            task: true,
          },
        },
      },
    });
  }

  async getMemberByWhatsAppJid(teamId: number, whatsappJid: string) {
    return await this.prisma.teamMember.findUnique({
      where: {
        teamId_whatsappJid: {
          teamId,
          whatsappJid,
        },
      },
      include: {
        team: true,
      },
    });
  }

  async getTeamMembers(teamId: number, role?: string) {
    return await this.prisma.teamMember.findMany({
      where: {
        teamId,
        active: true,
        ...(role && { role: role as any }),
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }

  async getTeamLeaders(teamId: number) {
    return await this.prisma.teamMember.findMany({
      where: {
        teamId,
        role: 'LEADER',
        active: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateMember(memberId: number, data: UpdateTeamMemberDto) {
    return await this.prisma.teamMember.update({
      where: { id: memberId },
      data,
      include: {
        team: true,
      },
    });
  }

  async removeMember(memberId: number) {
    // Soft delete - set active to false
    return await this.prisma.teamMember.update({
      where: { id: memberId },
      data: { active: false },
    });
  }

  async deleteMember(memberId: number) {
    // Hard delete
    return await this.prisma.teamMember.delete({
      where: { id: memberId },
    });
  }

  // ================== UTILITY METHODS ==================

  async isMemberLeader(memberId: number): Promise<boolean> {
    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
      select: { role: true },
    });
    return member?.role === 'LEADER';
  }

  async getMembersByWhatsAppJid(whatsappJid: string) {
    return await this.prisma.teamMember.findMany({
      where: {
        whatsappJid,
        active: true,
      },
      include: {
        team: true,
      },
    });
  }
}
