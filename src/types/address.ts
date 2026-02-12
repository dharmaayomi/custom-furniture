import { User } from "./user";

export type Address = {
  id: number;
  userId: number;
  user?: User;

  label: string;
  recipientName: string;
  phoneNumber: string;

  line1: string;
  line2?: string;

  city: string;
  district: string;
  province: string;
  country: string;

  latitude?: number;
  longitude?: number;

  postalCode: number;
  isDefault: boolean;

  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
