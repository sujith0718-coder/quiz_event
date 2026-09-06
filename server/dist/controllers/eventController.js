"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFreeze = exports.updateEventStatus = exports.createEvent = exports.getActiveEvent = exports.getEvents = void 0;
const Event_js_1 = require("../models/Event.js");
const Question_js_1 = require("../models/Question.js");
const socket_js_1 = require("../services/socket.js");
const getEvents = async (req, res) => {
    try {
        const events = await Event_js_1.Event.find().sort({ createdAt: -1 });
        return res.json({ events });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch events' });
    }
};
exports.getEvents = getEvents;
const getActiveEvent = async (req, res) => {
    try {
        let event = await Event_js_1.Event.findOne({ status: 'LIVE' });
        if (!event) {
            // Fallback: get latest event
            event = await Event_js_1.Event.findOne().sort({ createdAt: -1 });
        }
        if (!event) {
            // Auto-seed default event if none exists
            event = await Event_js_1.Event.create({
                name: 'Software Engineering & Systems Quiz 2026',
                description: 'Real-Time competition covering Data Structures, System Design, and Algorithmic Riddles.',
                status: 'UPCOMING',
                isFrozen: false,
            });
        }
        const questionCount = await Question_js_1.Question.countDocuments({ eventId: event._id });
        return res.json({ event, questionCount });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch active event' });
    }
};
exports.getActiveEvent = getActiveEvent;
const createEvent = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Event name is required' });
        }
        const event = await Event_js_1.Event.create({
            name,
            description: description || '',
            status: 'UPCOMING',
            isFrozen: false,
        });
        return res.status(201).json({ message: 'Event created successfully', event });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to create event' });
    }
};
exports.createEvent = createEvent;
const updateEventStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['UPCOMING', 'LIVE', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid event status' });
        }
        const event = await Event_js_1.Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        event.status = status;
        if (status === 'LIVE' && !event.startTime) {
            event.startTime = new Date();
        }
        else if (status === 'COMPLETED') {
            event.endTime = new Date();
        }
        await event.save();
        (0, socket_js_1.emitRoundChanged)(event._id.toString(), { status: event.status, isFrozen: event.isFrozen });
        return res.json({ message: 'Event status updated', event });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to update event status' });
    }
};
exports.updateEventStatus = updateEventStatus;
const toggleFreeze = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event_js_1.Event.findById(id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        event.isFrozen = !event.isFrozen;
        await event.save();
        (0, socket_js_1.emitRoundChanged)(event._id.toString(), { status: event.status, isFrozen: event.isFrozen });
        return res.json({
            message: `Leaderboard ${event.isFrozen ? 'frozen' : 'unfrozen'} successfully`,
            isFrozen: event.isFrozen,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to toggle leaderboard freeze' });
    }
};
exports.toggleFreeze = toggleFreeze;
