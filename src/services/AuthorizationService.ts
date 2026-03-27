// src/services/AuthorizationService.ts

// Role-Based Access Control (RBAC) implementation

// User Roles
const roles = {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest',
};

// Permissions mapping
const permissions = {
    [roles.ADMIN]: ['create', 'read', 'update', 'delete'],
    [roles.USER]: ['read', 'update'],
    [roles.GUEST]: ['read'],
};

// User database simulation
const users = new Map();

// Function to add a user
function addUser(username, role) {
    if (!roles[role]) {
        throw new Error('Role does not exist.');
    }
    users.set(username, role);
}

// Function to check user role
function checkUserRole(username) {
    return users.get(username) || roles.GUEST;
}

// Function to check user permissions
function hasPermission(username, action) {
    const role = checkUserRole(username);
    return permissions[role].includes(action);
}

// Role checking functions
function isAdmin(username) {
    return checkUserRole(username) === roles.ADMIN;
}

function isUser(username) {
    return checkUserRole(username) === roles.USER;
}

function isGuest(username) {
    return checkUserRole(username) === roles.GUEST;
}

// Example usage:
// addUser('john_doe', roles.USER);
// console.log(hasPermission('john_doe', 'create')); // should return false
// console.log(hasPermission('john_doe', 'read')); // should return true

export {
    addUser,
    checkUserRole,
    hasPermission,
    isAdmin,
    isUser,
    isGuest,
};
