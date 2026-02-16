"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";

type MeasurementUnit = "cm" | "inch" | "mm";
type ThemePreference = "system" | "light" | "dark";
type FloorTexture =
  | "/assets/texture/wood-texture.jpg"
  | "/assets/texture/light-wood-texture.jpg"
  | "/assets/texture/fine-wood-texture.jpg"
  | "/assets/texture/gray-abstract-texture.jpg";

const DEFAULT_ROOM_PREFERENCE = {
  width: 6.2,
  depth: 4.2,
  height: 3.0,
  wallColor: "#F2F0EB",
  floorTexture: "/assets/texture/wood-texture.jpg" as FloorTexture,
};

export const SettingsPage = () => {
  const [roomPreference, setRoomPreference] = useState(DEFAULT_ROOM_PREFERENCE);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>("cm");
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");
  const [emailNotif, setEmailNotif] = useState({
    orderUpdate: true,
    promo: false,
    checkoutReminder: true,
  });

  const handleSavePreferences = () => {
    toast.success("Preferences saved (demo)");
  };

  const handleResetInitialRoomPreference = () => {
    setRoomPreference(DEFAULT_ROOM_PREFERENCE);
    toast.success("Initial room preference reset to default (demo)");
  };

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
    toast.success("Cache cleared (demo)");
  };

  return (
    <section>
      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Configure your workspace, notifications, and preferences.
        </p>
      </div>

      <div className="from-muted/60 to-background rounded-lg bg-linear-to-b px-4 py-6 sm:px-6 sm:py-8">
        <div className="grid gap-6">
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h3 className="text-foreground text-base font-semibold">
              Initial Room Preference
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Set default room dimensions, wall color, and floor texture.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Width</p>
                <Input
                  type="number"
                  min="1"
                  step="0.1"
                  value={roomPreference.width}
                  onChange={(event) =>
                    setRoomPreference((prev) => ({
                      ...prev,
                      width: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Depth</p>
                <Input
                  type="number"
                  min="1"
                  step="0.1"
                  value={roomPreference.depth}
                  onChange={(event) =>
                    setRoomPreference((prev) => ({
                      ...prev,
                      depth: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Height</p>
                <Input
                  type="number"
                  min="1"
                  step="0.1"
                  value={roomPreference.height}
                  onChange={(event) =>
                    setRoomPreference((prev) => ({
                      ...prev,
                      height: Number(event.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Wall Color</p>
                <div className="border-input bg-background flex h-10 items-center gap-3 rounded-md border px-3">
                  <input
                    type="color"
                    value={roomPreference.wallColor}
                    onChange={(event) =>
                      setRoomPreference((prev) => ({
                        ...prev,
                        wallColor: event.target.value,
                      }))
                    }
                    className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-muted-foreground text-sm uppercase">
                    {roomPreference.wallColor}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Floor Texture</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={
                      roomPreference.floorTexture ===
                      "/assets/texture/wood-texture.jpg"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setRoomPreference((prev) => ({
                        ...prev,
                        floorTexture: "/assets/texture/wood-texture.jpg",
                      }))
                    }
                  >
                    Wood
                  </Button>
                  <Button
                    type="button"
                    variant={
                      roomPreference.floorTexture ===
                      "/assets/texture/light-wood-texture.jpg"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setRoomPreference((prev) => ({
                        ...prev,
                        floorTexture: "/assets/texture/light-wood-texture.jpg",
                      }))
                    }
                  >
                    Light Wood
                  </Button>
                  <Button
                    type="button"
                    variant={
                      roomPreference.floorTexture ===
                      "/assets/texture/fine-wood-texture.jpg"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setRoomPreference((prev) => ({
                        ...prev,
                        floorTexture: "/assets/texture/fine-wood-texture.jpg",
                      }))
                    }
                  >
                    Fine Wood
                  </Button>
                  <Button
                    type="button"
                    variant={
                      roomPreference.floorTexture ===
                      "/assets/texture/gray-abstract-texture.jpg"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setRoomPreference((prev) => ({
                        ...prev,
                        floorTexture:
                          "/assets/texture/gray-abstract-texture.jpg",
                      }))
                    }
                  >
                    Gray
                  </Button>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h3 className="text-foreground text-base font-semibold">
              Measurement Unit
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Choose the default unit in room customization.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={measurementUnit === "cm" ? "default" : "outline"}
                onClick={() => setMeasurementUnit("cm")}
              >
                CM
              </Button>
              <Button
                type="button"
                variant={measurementUnit === "inch" ? "default" : "outline"}
                onClick={() => setMeasurementUnit("inch")}
              >
                INCH
              </Button>
              <Button
                type="button"
                variant={measurementUnit === "mm" ? "default" : "outline"}
                onClick={() => setMeasurementUnit("mm")}
              >
                MM
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h3 className="text-foreground text-base font-semibold">
              Email Notifications
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage which updates are sent to your email.
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Order Update</p>
                  <p className="text-muted-foreground text-xs">
                    Receive order status and shipping updates.
                  </p>
                </div>
                <Switch
                  checked={emailNotif.orderUpdate}
                  onCheckedChange={(checked) =>
                    setEmailNotif((prev) => ({ ...prev, orderUpdate: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Promo</p>
                  <p className="text-muted-foreground text-xs">
                    Get discounts and promotional offers.
                  </p>
                </div>
                <Switch
                  checked={emailNotif.promo}
                  onCheckedChange={(checked) =>
                    setEmailNotif((prev) => ({ ...prev, promo: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Checkout Reminder</p>
                  <p className="text-muted-foreground text-xs">
                    Remind me when I leave items before checkout.
                  </p>
                </div>
                <Switch
                  checked={emailNotif.checkoutReminder}
                  onCheckedChange={(checked) =>
                    setEmailNotif((prev) => ({
                      ...prev,
                      checkoutReminder: checked,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h3 className="text-foreground text-base font-semibold">
              Theme Preference
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Select your preferred appearance mode.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant={themePreference === "system" ? "default" : "outline"}
                onClick={() => setThemePreference("system")}
              >
                System
              </Button>
              <Button
                type="button"
                variant={themePreference === "light" ? "default" : "outline"}
                onClick={() => setThemePreference("light")}
              >
                Light
              </Button>
              <Button
                type="button"
                variant={themePreference === "dark" ? "default" : "outline"}
                onClick={() => setThemePreference("dark")}
              >
                Dark
              </Button>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h3 className="text-foreground text-base font-semibold">
              Clear Cache
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Remove local cached data from your browser.
            </p>
            <div className="mt-4">
              <Button type="button" variant="outline" onClick={handleClearCache}>
                Clear Cache
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetInitialRoomPreference}
            >
              Reset to Default
            </Button>
            <Button type="button" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
