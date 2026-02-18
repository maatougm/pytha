import { IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class AddReactionDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50, { message: 'Reaction cannot exceed 50 characters' })
    reaction: string;
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
