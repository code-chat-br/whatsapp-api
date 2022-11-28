export class CreateGroupDto {
  subject: string;
  description?: string;
  participants: string[];
  profilePicture: string;
}

export class GroupJid {
  groupJid: string;
}

export class GroupUpdateParticipantDto extends GroupJid {
  action: 'add' | 'remove' | 'promote' | 'demote';
  paticipants: string[];
}
