"use client";

import React from "react";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Check } from "lucide-react";
import MapComponent from "./MapComponent";

export interface AddressFormData {
  label: string;
  recipientName: string;
  phoneNumber: string;
  line1: string;
  line2: string;
  city: string;
  district: string;
  province: string;
  country: string;
  latitude: number;
  longitude: number;
  postalCode: string;
  isDefault: boolean;
}

const INITIAL_STATE: AddressFormData = {
  label: "Home",
  recipientName: "",
  phoneNumber: "",
  line1: "",
  line2: "",
  city: "",
  district: "",
  province: "",
  country: "Indonesia",
  latitude: -7.747034,
  longitude: 110.377312,
  postalCode: "",
  isDefault: false,
};

interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  title?: string;
  description?: string;
  submitLabel?: string;
  onSubmit?: (data: AddressFormData) => Promise<void> | void;
}

export default function AddressForm({
  initialData,
  title = "Add New Address",
  description = "Fill in your delivery address details",
  submitLabel = "Save Address",
  onSubmit,
}: AddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>(() => ({
    ...INITIAL_STATE,
    ...initialData,
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!initialData) return;
    setFormData((prev) => ({
      ...prev,
      ...initialData,
    }));
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.currentTarget;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // TODO: Replace with your API endpoint
        console.log("Submitting address:", formData);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form Section */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {/* address section */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address Label */}
            <div className="space-y-2">
              <Label htmlFor="label" className="text-sm font-medium">
                Label
              </Label>
              <Input
                id="label"
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                placeholder="e.g., Home, Office"
                className="h-9"
              />
            </div>

            {/* Recipient Name */}
            <div className="space-y-2">
              <Label htmlFor="recipientName" className="text-sm font-medium">
                Recipient Name *
              </Label>
              <Input
                id="recipientName"
                name="recipientName"
                value={formData.recipientName}
                onChange={handleInputChange}
                placeholder="Full name"
                required
                className="h-9"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium">
                Phone Number *
              </Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+62 812 345 6789"
                required
                className="h-9"
              />
            </div>

            {/* Street Address Line 1 */}
            <div className="space-y-2">
              <Label htmlFor="line1" className="text-sm font-medium">
                Street Address *
              </Label>
              <Input
                id="line1"
                name="line1"
                value={formData.line1}
                onChange={handleInputChange}
                placeholder="Street address"
                required
                className="h-9"
              />
            </div>

            {/* Street Address Line 2 */}
            <div className="space-y-2">
              <Label htmlFor="line2" className="text-sm font-medium">
                Additional Info
              </Label>
              <Input
                id="line2"
                name="line2"
                value={formData.line2}
                onChange={handleInputChange}
                placeholder="Apartment, floor, etc."
                className="h-9"
              />
            </div>

            {/* District */}
            <div className="space-y-2">
              <Label htmlFor="district" className="text-sm font-medium">
                District *
              </Label>
              <Input
                id="district"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                placeholder="District"
                required
                className="h-9"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium">
                City *
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City"
                required
                className="h-9"
              />
            </div>

            {/* Province */}
            <div className="space-y-2">
              <Label htmlFor="province" className="text-sm font-medium">
                Province *
              </Label>
              <Input
                id="province"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                placeholder="Province"
                required
                className="h-9"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="postalCode" className="text-sm font-medium">
                Postal Code *
              </Label>
              <Input
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="55281"
                required
                className="h-9"
              />
            </div>

            {/* Default Address Checkbox */}
            <div className="border-input bg-background flex items-center gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
                className="h-4 w-4 cursor-pointer rounded"
              />
              <Label
                htmlFor="isDefault"
                className="cursor-pointer text-sm font-medium"
              >
                Set as default address
              </Label>
            </div>

            {/* Coordinates Display */}
            <div className="bg-secondary/50 rounded-lg p-3 text-xs">
              <p className="text-muted-foreground">
                📍 Lat: {formData.latitude.toFixed(6)} | Lng:{" "}
                {formData.longitude.toFixed(6)}
              </p>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {submitLabel}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Map Section */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Select Location
            </CardTitle>
            <CardDescription>
              Click on the map to select delivery location
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <MapComponent
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationSelect={handleMapSelect}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
