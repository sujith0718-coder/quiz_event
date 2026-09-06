import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  teamCode: string;
  leaderId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  score: number;
  currentQuestionOrder: number;
  completedAt?: Date;
  createdAt: Date;
}

const TeamSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    teamCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    leaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    score: { type: Number, default: 0 },
    currentQuestionOrder: { type: Number, default: 1 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>('Team', TeamSchema);
