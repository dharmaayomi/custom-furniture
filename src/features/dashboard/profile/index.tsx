"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useGetUser from "@/hooks/api/user/useGetUser";
import useUpdateProfile from "@/hooks/api/user/useUpdateProfile";
import useUploadAvatarProfile from "@/hooks/api/user/useUploadPhotoProfile";
import { useUser } from "@/providers/UserProvider";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/dhdpnfvfn/image/upload/v1768803916/user-icon_rbmcr4.png";

export const ProfilePage = () => {
  const { userId } = useUser();
  const { data: user, isLoading } = useGetUser(userId);
  const router = useRouter();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isRemoveAvatarDialogOpen, setIsRemoveAvatarDialogOpen] =
    useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAvatarSelectionInvalid, setIsAvatarSelectionInvalid] =
    useState(false);

  const [initialProfile, setInitialProfile] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [profileForm, setProfileForm] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } =
    useUploadAvatarProfile(userId, {
      onSuccess: () => {
        toast.success("Profile photo updated");
      },
      onError: (error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to update profile photo.";
        toast.error(message);
      },
    });

  const { mutateAsync: removeAvatar, isPending: isRemovingAvatar } =
    useUpdateProfile(userId, {
      onSuccess: () => {
        toast.success("Profile photo removed");
      },
      onError: (error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to remove profile photo.";
        toast.error(message);
      },
    });

  const { mutateAsync: saveProfile, isPending: isSavingProfile } =
    useUpdateProfile(userId, {
      onSuccess: () => {
        toast.success("Profile updated");
      },
      onError: (error) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to update profile.";
        toast.error(message);
      },
    });

  useEffect(() => {
    if (!user) return;
    const nextState = {
      userName: user.userName ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phoneNumber: user.phoneNumber ?? "",
    };
    setInitialProfile(nextState);
    setProfileForm(nextState);
  }, [user]);

  const hasProfileChanges = useMemo(() => {
    return (
      profileForm.userName !== initialProfile.userName ||
      profileForm.firstName !== initialProfile.firstName ||
      profileForm.lastName !== initialProfile.lastName ||
      profileForm.phoneNumber !== initialProfile.phoneNumber
    );
  }, [profileForm, initialProfile]);

  const handleAvatarFileChange = (files: File[]) => {
    if (selectedFile) {
      toast.error("Only 1 file is allowed. Remove current selection first.");
      return;
    }

    if (files.length !== 1) {
      setSelectedFile(null);
      setIsAvatarSelectionInvalid(true);
      toast.error("Please upload exactly 1 file.");
      return;
    }

    setIsAvatarSelectionInvalid(false);
    const file = files[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile || isAvatarSelectionInvalid) {
      toast.error("Please choose an image first.");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/avif",
      "image/jpg",
      "image/webp",
    ];
    const maxFileSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Invalid file type. Use JPG, PNG, AVIF, or WEBP.");
      return;
    }

    if (selectedFile.size > maxFileSize) {
      toast.error("File size is too large. Max 5MB.");
      return;
    }

    await uploadAvatar(selectedFile);
    setIsAvatarModalOpen(false);
    setSelectedFile(null);
    setIsAvatarSelectionInvalid(false);
  };

  const handleRemoveAvatar = async () => {
    await removeAvatar({ avatar: DEFAULT_AVATAR_URL });
    setIsRemoveAvatarDialogOpen(false);
  };

  const handleSaveProfile = async () => {
    const result = await saveProfile({
      userName: profileForm.userName,
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phoneNumber: profileForm.phoneNumber,
    });

    const nextState = {
      userName: result.userName ?? "",
      firstName: result.firstName ?? "",
      lastName: result.lastName ?? "",
      phoneNumber: result.phoneNumber ?? "",
    };
    setInitialProfile(nextState);
    setProfileForm(nextState);
  };

  return (
    <section>
      {/* Header */}

      <div className="bg-muted/60 mb-8 rounded-lg px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          Profile Information
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Manage your personal information and account details
        </p>
      </div>

      <div className="from-muted/60 to-background rounded-lg bg-linear-to-b px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
          {/* PROFILE SUMMARY */}
          <div className="bg-card relative flex w-full flex-col rounded-lg border shadow-sm lg:w-80">
            {/* top accent */}

            <div className="flex h-full flex-col items-center justify-between px-6 py-8">
              {/* Avatar section */}
              <div className="flex flex-col items-center">
                <Avatar className="ring-background h-28 w-28 shadow-md ring-4">
                  <AvatarImage
                    src={user?.avatar}
                    alt={user?.userName ?? "User"}
                  />
                  <AvatarFallback>
                    {isLoading ? "..." : (user?.userName?.charAt(0) ?? "U")}
                  </AvatarFallback>
                </Avatar>

                <div className="bg-muted mt-4 flex gap-2 rounded-full px-3 py-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setIsAvatarModalOpen(true)}
                        disabled={!userId}
                      >
                        <Pencil />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Change photo</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setIsRemoveAvatarDialogOpen(true)}
                        disabled={
                          !userId || user?.avatar === DEFAULT_AVATAR_URL
                        }
                        className="border-muted-foreground/20 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Remove photo</TooltipContent>
                  </Tooltip>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-base font-semibold">
                    Hi, {user?.userName ?? "username"} 👋
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Keep your profile information up to date.
                  </p>
                </div>
              </div>

              {/* Status section */}
              <div className="mt-8 w-full border-t pt-6 text-sm">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Account status
                    </span>
                    <span className="font-medium">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">Added</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone number</span>
                    <span className="font-medium">
                      {user?.phoneNumber ? "Added" : "Not added"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FORM */}
          <div className="bg-card relative flex-1 rounded-lg border shadow-sm">
            <div className="px-6 py-8">
              {/* Basic info */}
              <h3 className="text-muted-foreground mb-6 text-sm font-semibold">
                Basic Information
              </h3>

              <Field className="pb-6">
                <FieldLabel>User Name</FieldLabel>
                <Input
                  value={profileForm.userName}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      userName: e.target.value,
                    }))
                  }
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field className="pb-6">
                  <FieldLabel>First Name</FieldLabel>
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="capitalize"
                  />
                </Field>
                <Field className="pb-6">
                  <FieldLabel>Last Name</FieldLabel>
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="capitalize"
                  />
                </Field>
              </div>

              <Field className="pb-6">
                <FieldLabel>Phone Number</FieldLabel>
                <Input
                  value={profileForm.phoneNumber}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                />
              </Field>

              {/* Account Access */}
              <h3 className="text-muted-foreground mt-8 mb-4 text-sm font-semibold">
                Account Access
              </h3>

              <Field className="pb-6">
                <FieldLabel>Email</FieldLabel>
                <Input disabled value={user?.email ?? ""} />
                <p className="text-muted-foreground mt-2 text-xs">
                  Email cannot be changed.
                </p>
              </Field>

              <Field className="pb-6">
                <FieldLabel>Password</FieldLabel>
                <div className="flex gap-4">
                  <Input disabled value="********" />
                  <Button onClick={() => router.push("/dashboard/security")}>
                    Change Password
                  </Button>
                </div>
                <p className="text-muted-foreground mt-2 text-xs">
                  Password cannot be changed from this form.
                </p>
              </Field>

              {/* CTA */}
              <div className="mt-8 flex justify-end border-t pt-6">
                <Button
                  size="lg"
                  onClick={handleSaveProfile}
                  disabled={!hasProfileChanges || isSavingProfile || !userId}
                  className="min-w-40"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Dialog
          open={isAvatarModalOpen}
          onOpenChange={(open) => {
            setIsAvatarModalOpen(open);
            if (!open) {
              setSelectedFile(null);
              setIsAvatarSelectionInvalid(false);
            }
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Change profile photo</DialogTitle>
              <DialogDescription>
                Upload an image file (JPG, PNG, AVIF, WEBP). Maximum size is
                5MB.
              </DialogDescription>
            </DialogHeader>

            <div
              className={selectedFile ? "pointer-events-none opacity-60" : ""}
            >
              <FileUpload onChange={handleAvatarFileChange} />
            </div>
            {selectedFile ? (
              <p className="text-muted-foreground text-xs">
                1 file selected. Close and reopen this modal to choose a
                different file.
              </p>
            ) : null}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAvatarModalOpen(false)}
                disabled={isUploadingAvatar}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadAvatar}
                disabled={isUploadingAvatar || isAvatarSelectionInvalid}
              >
                {isUploadingAvatar ? "Uploading..." : "Save Photo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isRemoveAvatarDialogOpen}
          onOpenChange={setIsRemoveAvatarDialogOpen}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Remove profile photo?</DialogTitle>
              <DialogDescription>
                Your profile photo will be reset to the default avatar.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRemoveAvatarDialogOpen(false)}
                disabled={isRemovingAvatar}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveAvatar}
                disabled={isRemovingAvatar}
              >
                {isRemovingAvatar ? "Removing..." : "Remove Photo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};
