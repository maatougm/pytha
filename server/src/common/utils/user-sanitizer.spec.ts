import { sanitizeUser, sanitizeUsers } from './user-sanitizer';

describe('User Sanitizer', () => {
    const mockUser = {
        id: 'user-1',
        email: 'test@school.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        avatarUrl: 'https://example.com/avatar.jpg',
        status: 'active',
        lastLoginAt: new Date('2026-01-01'),
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        passwordHash: 'secret-hash-should-be-removed',
        userRoles: [
            { role: { name: 'student' } },
            { role: { name: 'parent' } },
        ],
    };

    describe('sanitizeUser', () => {
        it('should remove passwordHash and transform userRoles', () => {
            const result = sanitizeUser(mockUser);

            expect(result).not.toHaveProperty('passwordHash');
            expect(result).not.toHaveProperty('userRoles');
            expect(result.roles).toEqual(['student', 'parent']);
            expect(result.email).toBe(mockUser.email);
            expect(result.firstName).toBe(mockUser.firstName);
            expect(result.lastName).toBe(mockUser.lastName);
        });

        it('should handle user without roles', () => {
            const userWithoutRoles = {
                ...mockUser,
                userRoles: undefined,
            };

            const result = sanitizeUser(userWithoutRoles);

            expect(result.roles).toEqual([]);
        });

        it('should handle empty roles array', () => {
            const userWithEmptyRoles = {
                ...mockUser,
                userRoles: [],
            };

            const result = sanitizeUser(userWithEmptyRoles);

            expect(result.roles).toEqual([]);
        });
    });

    describe('sanitizeUsers', () => {
        it('should sanitize multiple users', () => {
            const users = [mockUser, { ...mockUser, id: 'user-2', email: 'test2@school.com' }];
            const results = sanitizeUsers(users);

            expect(results).toHaveLength(2);
            expect(results[0].id).toBe('user-1');
            expect(results[1].id).toBe('user-2');
            expect(results[0]).not.toHaveProperty('passwordHash');
            expect(results[1]).not.toHaveProperty('passwordHash');
        });

        it('should handle empty array', () => {
            const results = sanitizeUsers([]);

            expect(results).toEqual([]);
        });
    });
});
