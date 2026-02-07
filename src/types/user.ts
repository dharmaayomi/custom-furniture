import { en } from "zod/v4/locales";

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userName: string;
  role: Role;
};

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}
