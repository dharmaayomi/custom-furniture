import { User } from "./user";

export type Address = {
  id: number;
  userId: number;
  user: User;
  label: string;
  phoneNumber: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  postalCode: number;
  isDefault: Boolean;
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
