import { ReplicatorActivityLevel } from "./replicator";

export interface ReplicatorChange {
  activityLevel: ReplicatorActivityLevel;
  error: {
    code: number;
    domain: string;
    info: any;
  };
  progress: {
    completed: number;
    total: number;
  }
}