import mongoose, { Schema, Document } from 'mongoose';

export type QuestionType = 'MCQ' | 'RIDDLE';

export interface IQuestion extends Document {
  eventId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  points: number;
  order: number;
  unlockCondition?: string;
  createdAt: Date;
}

const QuestionSchema: Schema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['MCQ', 'RIDDLE'], required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    points: { type: Number, required: true, default: 10 },
    order: { type: Number, required: true },
    unlockCondition: { type: String, default: 'Previous question solved' },
  },
  { timestamps: true }
);

// Ensure index on eventId and order for sequence lookups
QuestionSchema.index({ eventId: 1, order: 1 });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
