/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author Pangeia Team                                                         │
 * │ @filename pangeia.router.ts                                                  │
 * │ Developed by: Pangeia Task Management System                                 │
 * │ Creation date: Oct 24, 2025                                                  │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Pangeia 2025. All rights reserved.                              │
 * │ Rotas da API REST para gestão de equipes e tarefas                           │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PangeiaController } from '../controllers/pangeia.controller';

export function pangeiaRouter(prisma: PrismaClient): Router {
  const router = Router();
  const controller = new PangeiaController(prisma);

  // ==================== TEAM ROUTES ====================

  // POST /pangeia/teams - Criar equipe
  router.post('/teams', (req, res) => controller.createTeam(req, res));

  // GET /pangeia/teams - Listar todas as equipes
  router.get('/teams', (req, res) => controller.getAllTeams(req, res));

  // GET /pangeia/teams/:teamId - Obter equipe por ID
  router.get('/teams/:teamId', (req, res) => controller.getTeam(req, res));

  // PUT /pangeia/teams/:teamId - Atualizar equipe
  router.put('/teams/:teamId', (req, res) => controller.updateTeam(req, res));

  // DELETE /pangeia/teams/:teamId - Deletar equipe
  router.delete('/teams/:teamId', (req, res) => controller.deleteTeam(req, res));

  // ==================== TEAM MEMBER ROUTES ====================

  // POST /pangeia/teams/:teamId/members - Adicionar membro à equipe
  router.post('/teams/:teamId/members', (req, res) => controller.addMember(req, res));

  // GET /pangeia/teams/:teamId/members - Listar membros da equipe
  router.get('/teams/:teamId/members', (req, res) => controller.getMembers(req, res));

  // PUT /pangeia/members/:memberId - Atualizar membro
  router.put('/members/:memberId', (req, res) => controller.updateMember(req, res));

  // DELETE /pangeia/members/:memberId - Remover membro
  router.delete('/members/:memberId', (req, res) => controller.removeMember(req, res));

  // ==================== TASK ROUTES ====================

  // POST /pangeia/teams/:teamId/tasks - Criar tarefa
  router.post('/teams/:teamId/tasks', (req, res) => controller.createTask(req, res));

  // GET /pangeia/teams/:teamId/tasks - Listar tarefas da equipe
  router.get('/teams/:teamId/tasks', (req, res) => controller.getTeamTasks(req, res));

  // GET /pangeia/tasks/:taskId - Obter tarefa por ID
  router.get('/tasks/:taskId', (req, res) => controller.getTask(req, res));

  // PUT /pangeia/tasks/:taskId - Atualizar tarefa
  router.put('/tasks/:taskId', (req, res) => controller.updateTask(req, res));

  // PATCH /pangeia/tasks/:taskId/status - Atualizar status da tarefa
  router.patch('/tasks/:taskId/status', (req, res) => controller.updateTaskStatus(req, res));

  // DELETE /pangeia/tasks/:taskId - Deletar tarefa
  router.delete('/tasks/:taskId', (req, res) => controller.deleteTask(req, res));

  // POST /pangeia/tasks/:taskId/assign - Atribuir membros à tarefa
  router.post('/tasks/:taskId/assign', (req, res) => controller.assignMembers(req, res));

  // POST /pangeia/tasks/:taskId/comments - Adicionar comentário
  router.post('/tasks/:taskId/comments', (req, res) => controller.addComment(req, res));

  // GET /pangeia/tasks/:taskId/comments - Listar comentários da tarefa
  router.get('/tasks/:taskId/comments', (req, res) => controller.getComments(req, res));

  // GET /pangeia/members/:memberId/tasks - Listar tarefas do membro
  router.get('/members/:memberId/tasks', (req, res) => controller.getMemberTasks(req, res));

  // ==================== STATISTICS & REPORTS ROUTES ====================

  // GET /pangeia/teams/:teamId/statistics - Estatísticas da equipe
  router.get('/teams/:teamId/statistics', (req, res) => controller.getTeamStatistics(req, res));

  // GET /pangeia/teams/:teamId/overdue - Tarefas em atraso da equipe
  router.get('/teams/:teamId/overdue', (req, res) => controller.getOverdueTasks(req, res));

  // GET /pangeia/members/:memberId/statistics - Estatísticas do membro
  router.get('/members/:memberId/statistics', (req, res) => controller.getMemberStatistics(req, res));

  return router;
}
