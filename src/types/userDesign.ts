import { User } from "./user";

export type UserDesign = {
  id: number;
  userId: number;
  user: User;
  designCode: string;
  designName: string;
  configuration: JSON;
  fileFinalUrl: string;
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
