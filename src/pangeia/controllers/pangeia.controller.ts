/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author Pangeia Team                                                         │
 * │ @filename pangeia.controller.ts                                              │
 * │ Developed by: Pangeia Task Management System                                 │
 * │ Creation date: Oct 24, 2025                                                  │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Pangeia 2025. All rights reserved.                              │
 * │ Controller para API REST de gestão de equipes e tarefas                      │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TeamService } from '../services/team.service';
import { TaskService } from '../services/task.service';
import {
  CreateTeamDto,
  UpdateTeamDto,
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from '../dto/team.dto';
import {
  CreateTaskDto,
  UpdateTaskDto,
  CreateTaskCommentDto,
  TaskStatus,
} from '../dto/task.dto';

export class PangeiaController {
  private teamService: TeamService;
  private taskService: TaskService;

  constructor(private readonly prisma: PrismaClient) {
    this.teamService = new TeamService(prisma);
    this.taskService = new TaskService(prisma);
  }

  // ==================== TEAM ENDPOINTS ====================

  async createTeam(req: Request, res: Response) {
    try {
      const data: CreateTeamDto = req.body;
      const team = await this.teamService.createTeam(data);
      return res.status(201).json(team);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getTeam(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const team = await this.teamService.getTeamById(teamId);

      if (!team) {
        return res.status(404).json({ error: 'Equipe não encontrada' });
      }

      return res.json(team);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getAllTeams(req: Request, res: Response) {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const teams = await this.teamService.getAllTeams(activeOnly);
      return res.json(teams);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateTeam(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const data: UpdateTeamDto = req.body;
      const team = await this.teamService.updateTeam(teamId, data);
      return res.json(team);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteTeam(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      await this.teamService.deleteTeam(teamId);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // ==================== TEAM MEMBER ENDPOINTS ====================

  async addMember(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const data: CreateTeamMemberDto = req.body;
      const member = await this.teamService.addMember(teamId, data);
      return res.status(201).json(member);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getMembers(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const role = req.query.role as string | undefined;
      const members = await this.teamService.getTeamMembers(teamId, role);
      return res.json(members);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateMember(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.memberId);
      const data: UpdateTeamMemberDto = req.body;
      const member = await this.teamService.updateMember(memberId, data);
      return res.json(member);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.memberId);
      await this.teamService.removeMember(memberId);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // ==================== TASK ENDPOINTS ====================

  async createTask(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const creatorId = parseInt(req.body.creatorId);
      const data: CreateTaskDto = req.body;
      const task = await this.taskService.createTask(teamId, creatorId, data);
      return res.status(201).json(task);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await this.taskService.getTaskById(taskId);

      if (!task) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      return res.json(task);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getTeamTasks(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const status = req.query.status as TaskStatus | undefined;
      const priority = req.query.priority as string | undefined;

      const filters = {
        ...(status && { status }),
        ...(priority && { priority }),
      };

      const tasks = await this.taskService.getTeamTasks(teamId, filters);
      return res.json(tasks);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getMemberTasks(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.memberId);
      const status = req.query.status as TaskStatus | undefined;

      const filters = status ? { status } : undefined;
      const tasks = await this.taskService.getMemberTasks(memberId, filters);
      return res.json(tasks);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      const data: UpdateTaskDto = req.body;
      const task = await this.taskService.updateTask(taskId, data);
      return res.json(task);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateTaskStatus(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      const { status, changedById, comment } = req.body;
      const task = await this.taskService.updateTaskStatus(
        taskId,
        status as TaskStatus,
        changedById,
        comment,
      );
      return res.json(task);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteTask(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      await this.taskService.deleteTask(taskId);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async assignMembers(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      const { memberIds } = req.body;
      const task = await this.taskService.assignMembers(taskId, memberIds);
      return res.json(task);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      const authorId = parseInt(req.body.authorId);
      const data: CreateTaskCommentDto = req.body;
      const comment = await this.taskService.addComment(taskId, authorId, data);
      return res.status(201).json(comment);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getComments(req: Request, res: Response) {
    try {
      const taskId = parseInt(req.params.taskId);
      const comments = await this.taskService.getTaskComments(taskId);
      return res.json(comments);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // ==================== STATISTICS & REPORTS ====================

  async getTeamStatistics(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const stats = await this.taskService.getTeamStatistics(teamId);
      return res.json(stats);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getMemberStatistics(req: Request, res: Response) {
    try {
      const memberId = parseInt(req.params.memberId);
      const stats = await this.taskService.getMemberStatistics(memberId);
      return res.json(stats);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getOverdueTasks(req: Request, res: Response) {
    try {
      const teamId = parseInt(req.params.teamId);
      const tasks = await this.taskService.getOverdueTasks(teamId);
      return res.json(tasks);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}
