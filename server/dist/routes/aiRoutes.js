"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_js_1 = require("../controllers/aiController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.post('/hint', auth_js_1.authenticateToken, aiController_js_1.getAIHint);
exports.default = router;
