"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useForgotPassword from "@/hooks/api/auth/useForgotPassword";
import { axiosInstance } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(5, "Password must be at least 5 characters."),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [resetEmail, setResetEmail] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutateAsync: login, isPending } = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const result = await axiosInstance.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      return result.data;
    },
    onSuccess: async (result) => {
      const payload = (result as any)?.data ?? result;
      const userId = payload?.id;

      if (userId === undefined || userId === null) {
        toast.error("Login failed: missing user id");
        return;
      }

      await signIn("credentials", {
        id: String(userId),
        role: payload?.role ?? "",
        accessToken: payload?.accessToken ?? "",
        redirect: false,
      });

      toast.success("Login success");
      router.push("/custom");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
  const { mutateAsync: forgotPassword, isPending: isSendingResetEmail } =
    useForgotPassword({
      onSuccess: (result) => {
        toast.success(
          result?.message ?? "Reset password link has been sent to your email",
        );
      },
      onError: (error) => {
        toast.error(
          getApiErrorMessage(error, "Failed to send reset password email."),
        );
      },
    });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await login(data);
  }

  const handleSendResetEmail = async () => {
    if (!resetEmail.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    await forgotPassword({ email: resetEmail.trim() });
    setIsForgotPasswordOpen(false);
    setResetEmail("");
  };

  const handleCloseForgotPasswordDialog = () => {
    if (isSendingResetEmail) return;
    setIsForgotPasswordOpen(false);
    setResetEmail("");
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <CardHeader className="pb-6 text-center">
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="form-login" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="m@example.com"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex justify-between">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <button
                        type="button"
                        className="text-xs underline"
                        onClick={() => setIsForgotPasswordOpen(true)}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        {...field}
                        id="password"
                        type={isPasswordVisible ? "text" : "password"}
                        autoComplete="current-password"
                        aria-invalid={fieldState.invalid}
                        placeholder="Your password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                        aria-label={
                          isPasswordVisible ? "Hide password" : "Show password"
                        }
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Field>
                <Button
                  type="submit"
                  form="form-login"
                  disabled={isPending}
                  className="bg-primary"
                >
                  {isPending ? "Loading" : "Login"}
                </Button>

                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/register">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </div>

      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot password</DialogTitle>
            <DialogDescription>
              Enter your account email and we&apos;ll send a reset link.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </Field>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseForgotPasswordDialog}
              disabled={isSendingResetEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendResetEmail}
              disabled={isSendingResetEmail}
            >
              {isSendingResetEmail ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
