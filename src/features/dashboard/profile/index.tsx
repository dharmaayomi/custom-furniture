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
import { Pencil, Trash, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/dhdpnfvfn/image/upload/v1768803916/user-icon_rbmcr4.png";

export const ProfilePage = () => {
  const { userId } = useUser();
  const { data: user, isLoading } = useGetUser(userId);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isRemoveAvatarDialogOpen, setIsRemoveAvatarDialogOpen] =
    useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const router = useRouter();

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
  const { mutateAsync: updateProfile, isPending: isRemovingAvatar } =
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

  const handleAvatarFileChange = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile) {
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
  };

  const handleRemoveAvatar = async () => {
    await updateProfile({ avatar: DEFAULT_AVATAR_URL });
    setIsRemoveAvatarDialogOpen(false);
  };

  return (
    <section className="p-3">
      <div className="flex items-center justify-between">
        <div className="pb-8">
          <h1 className="text-foreground text-lg font-bold tracking-tight md:text-3xl">
            Profile Information
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage your delivery addresses
          </p>
        </div>
      </div>
      <div className="flex gap-8">
        {/* photo profile */}
        <div className="bg-muted/50 w-lg items-center rounded-md p-4">
          <div className="flex justify-center p-4">
            <Avatar className="h-30 w-30">
              <AvatarImage src={user?.avatar} alt={user?.userName ?? "User"} />
              <AvatarFallback>
                {isLoading ? "..." : (user?.userName?.charAt(0) ?? "U")}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex justify-center gap-2 pb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={() => setIsAvatarModalOpen(true)}
                  disabled={!userId}
                >
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Change Profile Photo
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => setIsRemoveAvatarDialogOpen(true)}
                  disabled={!userId || user?.avatar === DEFAULT_AVATAR_URL}
                >
                  <Trash2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Remove Profile Photo
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* user Info */}
        <div className="bg-muted/50 w-full flex-1 rounded-md p-4">
          <Field className="pb-8">
            <FieldLabel>User Name</FieldLabel>
            <Input disabled defaultValue={user?.userName} />
          </Field>
          <div className="flex gap-4">
            <Field className="pb-8">
              <FieldLabel>First Name</FieldLabel>
              <Input disabled defaultValue={user?.firstName} />
            </Field>
            <Field className="pb-8">
              <FieldLabel>Last Name</FieldLabel>
              <Input disabled defaultValue={user?.lastName} />
            </Field>
          </div>

          <Field className="pb-8">
            <FieldLabel>Phone Number</FieldLabel>
            <Input disabled defaultValue={user?.phoneNumber} />
          </Field>
          <Field className="pb-8">
            <FieldLabel>Email</FieldLabel>
            <Input disabled defaultValue={user?.email} />
          </Field>
          <Field className="pb-8">
            <FieldLabel>Password</FieldLabel>
            <div className="flex gap-3">
              <Input disabled defaultValue="********" />
              <Button
                variant="secondary"
                onClick={() => router.push("/dashboard/security")}
              >
                Change Password
              </Button>
            </div>
          </Field>
        </div>
      </div>

      <Dialog
        open={isAvatarModalOpen}
        onOpenChange={(open) => {
          setIsAvatarModalOpen(open);
          if (!open) {
            setSelectedFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Change profile photo</DialogTitle>
            <DialogDescription>
              Upload an image file (JPG, PNG, AVIF, WEBP). Maximum size is 5MB.
            </DialogDescription>
          </DialogHeader>

          <FileUpload onChange={handleAvatarFileChange} />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAvatarModalOpen(false)}
              disabled={isUploadingAvatar}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadAvatar} disabled={isUploadingAvatar}>
              {isUploadingAvatar ? "Uploading..." : "Save Photo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRemoveAvatarDialogOpen}
        onOpenChange={setIsRemoveAvatarDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
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
    </section>
  );
};
