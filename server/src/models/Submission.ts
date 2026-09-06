import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmission extends Document {
  teamId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  answer: string;
  isCorrect: boolean;
  pointsAwarded: number;
  submittedAt: Date;
}

const SubmissionSchema: Schema = new Schema(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    answer: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, required: true },
    pointsAwarded: { type: Number, required: true, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index to prevent duplicate scoring per team & question if needed, or query history
SubmissionSchema.index({ teamId: 1, questionId: 1 });

export const Submission = mongoose.model<ISubmission>('Submission', SubmissionSchema);
