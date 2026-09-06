import { Request, Response } from 'express';
import { Event } from '../models/Event.js';
import { Question } from '../models/Question.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitRoundChanged } from '../services/socket.js';

export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    return res.json({ events });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch events' });
  }
};

export const getActiveEvent = async (req: Request, res: Response) => {
  try {
    let event = await Event.findOne({ status: 'LIVE' });
    if (!event) {
      // Fallback: get latest event
      event = await Event.findOne().sort({ createdAt: -1 });
    }
    
    if (!event) {
      // Auto-seed default event if none exists
      event = await Event.create({
        name: 'Software Engineering & Systems Quiz 2026',
        description: 'Real-Time competition covering Data Structures, System Design, and Algorithmic Riddles.',
        status: 'UPCOMING',
        isFrozen: false,
      });
    }

    const questionCount = await Question.countDocuments({ eventId: event._id });

    return res.json({ event, questionCount });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch active event' });
  }
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    const event = await Event.create({
      name,
      description: description || '',
      status: 'UPCOMING',
      isFrozen: false,
    });

    return res.status(201).json({ message: 'Event created successfully', event });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create event' });
  }
};

export const updateEventStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['UPCOMING', 'LIVE', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid event status' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.status = status;
    if (status === 'LIVE' && !event.startTime) {
      event.startTime = new Date();
    } else if (status === 'COMPLETED') {
      event.endTime = new Date();
    }
    await event.save();

    emitRoundChanged(event._id.toString(), { status: event.status, isFrozen: event.isFrozen });

    return res.json({ message: 'Event status updated', event });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update event status' });
  }
};

export const toggleFreeze = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.isFrozen = !event.isFrozen;
    await event.save();

    emitRoundChanged(event._id.toString(), { status: event.status, isFrozen: event.isFrozen });

    return res.json({
      message: `Leaderboard ${event.isFrozen ? 'frozen' : 'unfrozen'} successfully`,
      isFrozen: event.isFrozen,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to toggle leaderboard freeze' });
  }
};
