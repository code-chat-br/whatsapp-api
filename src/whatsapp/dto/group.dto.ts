export class CreateGroupDto {
  subject: string;
  description?: string;
  participants: string[];
}

export class GroupPictureDto {
  groupJid: string;
  image: string;
}

export class GroupJid {
  groupJid: string;
}

export class GroupUpdateParticipantDto extends GroupJid {
  action: 'add' | 'remove' | 'promote' | 'demote';
  participants: string[];
}
