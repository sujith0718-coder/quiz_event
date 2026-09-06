"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireParticipant = exports.requireAdmin = exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthenticated user' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['ADMIN']);
exports.requireParticipant = (0, exports.requireRole)(['PARTICIPANT', 'ADMIN']);
