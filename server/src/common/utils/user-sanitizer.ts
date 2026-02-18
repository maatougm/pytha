export function sanitizeUser(user: any) {
    if (!user) return null;
    const { passwordHash, userRoles, ...rest } = user;
    return {
        ...rest,
        roles: userRoles?.map((ur: any) => ur.role.name) || [],
    };
}

export function sanitizeUsers(users: any[]) {
    return users.map(user => sanitizeUser(user));
}
