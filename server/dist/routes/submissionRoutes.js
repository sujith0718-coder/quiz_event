"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submissionController_js_1 = require("../controllers/submissionController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.post('/', auth_js_1.authenticateToken, submissionController_js_1.submitAnswer);
router.get('/my-team', auth_js_1.authenticateToken, submissionController_js_1.getTeamSubmissions);
exports.default = router;
