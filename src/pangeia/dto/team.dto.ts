/**
 * ┌──────────────────────────────────────────────────────────────────────────────┐
 * │ @author Pangeia Team                                                         │
 * │ @filename team.dto.ts                                                        │
 * │ Developed by: Pangeia Task Management System                                 │
 * │ Creation date: Oct 24, 2025                                                  │
 * ├──────────────────────────────────────────────────────────────────────────────┤
 * │ @copyright © Pangeia 2025. All rights reserved.                              │
 * │ Licensed under the Apache License, Version 2.0                               │
 * └──────────────────────────────────────────────────────────────────────────────┘
 */

import { IsString, IsOptional, IsBoolean, IsEnum, Length } from 'class-validator';

export enum TeamMemberRole {
  LEADER = 'LEADER',
  ASSIGNED = 'ASSIGNED',
}

export class CreateTeamDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateTeamMemberDto {
  @IsString()
  whatsappJid: string;

  @IsString()
  @Length(1, 100)
  name: string;

  @IsEnum(TeamMemberRole)
  role: TeamMemberRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsEnum(TeamMemberRole)
  role?: TeamMemberRole;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
