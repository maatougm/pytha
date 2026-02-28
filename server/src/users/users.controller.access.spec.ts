import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('UsersController - Access Control', () => {
    let controller: UsersController;
    let mockUsersService: jest.Mocked<UsersService>;

    beforeEach(async () => {
        mockUsersService = {
            findById: jest.fn(),
            findPublicProfile: jest.fn(),
            hasRelationship: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                { provide: UsersService, useValue: mockUsersService },
            ],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get<UsersController>(UsersController);
    });

    describe('findById access control', () => {
        const mockUser = {
            id: '550e8400-e29b-41d4-a716-446655440001',
            firstName: 'Test',
            lastName: 'User',
        };

        it('should allow user to view their own full profile', async () => {
            mockUsersService.findById.mockResolvedValue(mockUser as any);

            const req = { user: { sub: mockUser.id, roles: ['student'] } };
            const result = await controller.findById(mockUser.id, req);

            expect(result).toEqual(mockUser);
            expect(mockUsersService.findById).toHaveBeenCalledWith(mockUser.id);
        });

        it('should allow admin to view any full profile', async () => {
            mockUsersService.findById.mockResolvedValue(mockUser as any);

            const req = { user: { sub: 'admin-id', roles: ['admin'] } };
            const result = await controller.findById(mockUser.id, req);

            expect(result).toEqual(mockUser);
            expect(mockUsersService.findById).toHaveBeenCalledWith(mockUser.id);
        });

        it('should allow teacher to view any full profile', async () => {
            mockUsersService.findById.mockResolvedValue(mockUser as any);

            const req = { user: { sub: 'teacher-id', roles: ['teacher'] } };
            const result = await controller.findById(mockUser.id, req);

            expect(result).toEqual(mockUser);
            expect(mockUsersService.findById).toHaveBeenCalledWith(mockUser.id);
        });

        it('should reject invalid UUID format', async () => {
            const req = { user: { sub: 'user-id', roles: ['student'] } };

            await expect(controller.findById('invalid-uuid', req))
                .rejects.toThrow(BadRequestException);

            expect(mockUsersService.findPublicProfile).not.toHaveBeenCalled();
        });

        it('should reject access to unrelated user profile', async () => {
            mockUsersService.hasRelationship.mockResolvedValue(false);

            const req = { user: { sub: '550e8400-e29b-41d4-a716-446655440002', roles: ['student'] } };

            await expect(controller.findById('550e8400-e29b-41d4-a716-446655440003', req))
                .rejects.toThrow(ForbiddenException);
        });

        it('should allow access to related user profile', async () => {
            mockUsersService.hasRelationship.mockResolvedValue(true);
            mockUsersService.findPublicProfile.mockResolvedValue({
                id: '550e8400-e29b-41d4-a716-446655440003',
                firstName: 'Related',
                lastName: 'User',
            } as any);

            const req = { user: { sub: '550e8400-e29b-41d4-a716-446655440002', roles: ['parent'] } };
            const result = await controller.findById('550e8400-e29b-41d4-a716-446655440003', req);

            expect(result).toBeDefined();
            expect(mockUsersService.hasRelationship).toHaveBeenCalled();
        });
    });
});
