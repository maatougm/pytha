import { IsString, MaxLength, IsNotEmpty, IsUUID } from 'class-validator';

export class AddReactionDto {
    @IsString({ message: 'Reaction must be a string' })
    @IsNotEmpty({ message: 'Reaction is required' })
    @MaxLength(50, { message: 'Reaction cannot exceed 50 characters' })
    reaction: string;
}

export class RemoveReactionDto {
    @IsString({ message: 'Reaction ID must be a string' })
    @IsNotEmpty({ message: 'Reaction ID is required' })
    @IsUUID('4', { message: 'Invalid reaction ID' })
    reactionId: string;
}

export class ReactionResponseDto {
    id: string;
    messageId: string;
    userId: string;
    reaction: string;
    createdAt: Date;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
    };
}

export class EditHistoryEntryDto {
    id: string;
    messageId: string;
    previousContent: string;
    editedBy: string;
    editedAt: Date;
    editor: {
        id: string;
        firstName: string;
        lastName: string;
    };
}
