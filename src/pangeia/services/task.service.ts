/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author Pangeia Team                                                         │
 * │ @filename task.service.ts                                                    │
 * │ Developed by: Pangeia Task Management System                                 │
 * │ Creation date: Oct 24, 2025                                                  │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Pangeia 2025. All rights reserved.                              │
 * │ Licensed under the Apache License, Version 2.0                               │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { PrismaClient } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, CreateTaskCommentDto, TaskStatus } from '../dto/task.dto';

export class TaskService {
  constructor(private readonly prisma: PrismaClient) {}

  // ================== TASK OPERATIONS ==================

  async createTask(teamId: number, creatorId: number, data: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        teamId,
        creatorId,
        title: data.title,
        description: data.description,
        priority: data.priority ?? 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'PENDING',
      },
      include: {
        creator: true,
        team: true,
      },
    });

    // Assign members if provided
    if (data.assignedMemberIds && data.assignedMemberIds.length > 0) {
      await this.assignMembers(task.id, data.assignedMemberIds);
    }

    // Create initial status history
    await this.prisma.taskStatusHistory.create({
      data: {
        taskId: task.id,
        changedById: creatorId,
        previousStatus: null,
        newStatus: 'PENDING',
        comment: 'Tarefa criada',
      },
    });

    return this.getTaskById(task.id);
  }

  async getTaskById(taskId: number) {
    return await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: true,
        team: true,
        assignments: {
          include: {
            member: true,
          },
        },
        comments: {
          include: {
            author: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          include: {
            changedBy: true,
          },
          orderBy: { changedAt: 'desc' },
        },
      },
    });
  }

  async getTeamTasks(teamId: number, filters?: { status?: TaskStatus; priority?: string }) {
    return await this.prisma.task.findMany({
      where: {
        teamId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.priority && { priority: filters.priority as any }),
      },
      include: {
        creator: true,
        assignments: {
          include: {
            member: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getMemberTasks(memberId: number, filters?: { status?: TaskStatus }) {
    return await this.prisma.task.findMany({
      where: {
        assignments: {
          some: {
            memberId,
          },
        },
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        creator: true,
        team: true,
        assignments: {
          include: {
            member: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  async updateTask(taskId: number, data: UpdateTaskDto) {
    return await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority && { priority: data.priority }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
      },
      include: {
        creator: true,
        assignments: {
          include: {
            member: true,
          },
        },
      },
    });
  }

  async updateTaskStatus(taskId: number, newStatus: TaskStatus, changedById: number, comment?: string) {
    const currentTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { status: true },
    });

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
      },
    });

    // Log status change
    await this.prisma.taskStatusHistory.create({
      data: {
        taskId,
        changedById,
        previousStatus: currentTask?.status as any,
        newStatus: newStatus as any,
        comment,
      },
    });

    return this.getTaskById(taskId);
  }

  async deleteTask(taskId: number) {
    return await this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  // ================== TASK ASSIGNMENT OPERATIONS ==================

  async assignMembers(taskId: number, memberIds: number[]) {
    const assignments = memberIds.map((memberId) => ({
      taskId,
      memberId,
    }));

    await this.prisma.taskAssignment.createMany({
      data: assignments,
      skipDuplicates: true,
    });

    return this.getTaskById(taskId);
  }

  async unassignMember(taskId: number, memberId: number) {
    await this.prisma.taskAssignment.delete({
      where: {
        taskId_memberId: {
          taskId,
          memberId,
        },
      },
    });

    return this.getTaskById(taskId);
  }

  async getTaskAssignments(taskId: number) {
    return await this.prisma.taskAssignment.findMany({
      where: { taskId },
      include: {
        member: true,
        task: true,
      },
    });
  }

  // ================== TASK COMMENT OPERATIONS ==================

  async addComment(taskId: number, authorId: number, data: CreateTaskCommentDto) {
    const comment = await this.prisma.taskComment.create({
      data: {
        taskId,
        authorId,
        content: data.content,
      },
      include: {
        author: true,
        task: true,
      },
    });

    return comment;
  }

  async getTaskComments(taskId: number) {
    return await this.prisma.taskComment.findMany({
      where: { taskId },
      include: {
        author: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteComment(commentId: number) {
    return await this.prisma.taskComment.delete({
      where: { id: commentId },
    });
  }

  // ================== STATISTICS & REPORTS ==================

  async getTeamStatistics(teamId: number) {
    const [total, pending, inProgress, completed, cancelled, onHold] = await Promise.all([
      this.prisma.task.count({ where: { teamId } }),
      this.prisma.task.count({ where: { teamId, status: 'PENDING' } }),
      this.prisma.task.count({ where: { teamId, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { teamId, status: 'COMPLETED' } }),
      this.prisma.task.count({ where: { teamId, status: 'CANCELLED' } }),
      this.prisma.task.count({ where: { teamId, status: 'ON_HOLD' } }),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
      onHold,
    };
  }

  async getMemberStatistics(memberId: number) {
    const tasks = await this.getMemberTasks(memberId);

    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'PENDING').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length,
    };
  }

  async getOverdueTasks(teamId: number) {
    return await this.prisma.task.findMany({
      where: {
        teamId,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        creator: true,
        assignments: {
          include: {
            member: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
}
