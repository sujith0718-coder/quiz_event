import mongoose, { Schema, Document } from 'mongoose';

export type EventStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';

export interface IEvent extends Document {
  name: string;
  description: string;
  status: EventStatus;
  isFrozen: boolean;
  startTime?: Date;
  endTime?: Date;
  createdAt: Date;
}

const EventSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['UPCOMING', 'LIVE', 'COMPLETED'], default: 'UPCOMING' },
    isFrozen: { type: Boolean, default: false },
    startTime: { type: Date },
    endTime: { type: Date },
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>('Event', EventSchema);
