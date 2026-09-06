"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboardController_js_1 = require("../controllers/leaderboardController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/:eventId', auth_js_1.authenticateToken, leaderboardController_js_1.getLeaderboard);
exports.default = router;
