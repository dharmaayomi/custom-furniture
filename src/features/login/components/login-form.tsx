// import { Button } from "@/components/ui/button";
// import {
//   Field,
//   FieldDescription,
//   FieldError,
//   FieldGroup,
//   FieldLabel,
// } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { cn } from "@/lib/utils";
// import { z } from "zod";
// import { Controller, useForm } from "react-hook-form";
// import { useRouter } from "next/navigation";
// import { axiosInstance } from "@/lib/axios";
// import { useMutation } from "@tanstack/react-query";
// import { signIn } from "next-auth/react";
// import { toast } from "sonner";
// import { AxiosError } from "axios";
// import Link from "next/link";

// const formSchema = z.object({
//   email: z.email(),
//   password: z.string().min(5, "Password must be at least 5 characters."),
// });
// export function LoginForm({
//   className,
//   ...props
// }: React.ComponentProps<"div">) {
//   const router = useRouter();

//   const form = useForm<z.infer<typeof formSchema>>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//     },
//   });

//   const { mutateAsync: login, isPending } = useMutation({
//     mutationFn: async (data: z.infer<typeof formSchema>) => {
//       const result = await axiosInstance.post("/auth/login", {
//         email: data.email,
//         password: data.password,
//       });

//       return result.data;
//     },
//     onSuccess: async (result) => {
//       await signIn("credentials", {
//         id: result.id,
//         name: result.name,
//         email: result.email,
//         accessToken: result.accessToken,
//         redirect: false,
//       });

//       toast.success("Login success");
//       router.push("/");
//     },
//     onError: (error: AxiosError<{ message: string }>) => {
//       toast.error(error.response?.data.message ?? "Something went wrong!");
//     },
//   });

//   async function onSubmit(data: z.infer<typeof formSchema>) {
//     await login(data);
//   }

//   return (
//     <div className={cn("flex flex-col gap-6", className)} {...props}>
//       <FieldGroup className="gap-6">
//         <div className="flex flex-col items-center gap-1 text-center">
//           <h1 className="text-2xl font-bold">Login to your account</h1>
//           <p className="text-muted-foreground text-sm text-balance">
//             Enter your email below to login to your account
//           </p>
//         </div>
//         <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
//           <Field className="pb-6">
//             <Controller
//               name="email"
//               control={form.control}
//               render={({ field, fieldState }) => (
//                 <Field data-invalid={fieldState.invalid}>
//                   <FieldLabel htmlFor="email">Email</FieldLabel>
//                   <Input
//                     {...field}
//                     id="email"
//                     type="email"
//                     aria-invalid={fieldState.invalid}
//                     placeholder="m@example.com"
//                   />
//                   {fieldState.invalid && (
//                     <FieldError errors={[fieldState.error]} />
//                   )}
//                 </Field>
//               )}
//             />
//           </Field>

//           <Field className="pb-6">
//             <Controller
//               name="password"
//               control={form.control}
//               render={({ field, fieldState }) => (
//                 <Field data-invalid={fieldState.invalid}>
//                   <FieldLabel htmlFor="password">Password</FieldLabel>
//                   <Input
//                     {...field}
//                     id="password"
//                     type="password"
//                     aria-invalid={fieldState.invalid}
//                     placeholder="Your password"
//                   />
//                   {fieldState.invalid && (
//                     <FieldError errors={[fieldState.error]} />
//                   )}
//                 </Field>
//               )}
//             />
//           </Field>

//           <Field className="pb-6">
//             <Button type="submit" form="form-login" disabled={isPending}>
//               {isPending ? "Loading" : "Login"}
//             </Button>

//             <FieldDescription className="text-center">
//               Don&apos;t have an account? <Link href="/register">Sign up</Link>
//             </FieldDescription>
//           </Field>
//         </form>
//       </FieldGroup>
//     </div>
//   );
// }

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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
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
      await signIn("credentials", {
        id: result.id,
        name: result.name,
        email: result.email,
        accessToken: result.accessToken,
        redirect: false,
      });

      toast.success("Login success");
      router.push("/");
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data.message ?? "Something went wrong!");
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await login(data);
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div>
        <CardHeader>
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
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="password"
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Your password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Field>
                <Button type="submit" form="form-login" disabled={isPending}>
                  {isPending ? "Loading" : "Login"}
                </Button>

                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="#">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </div>
    </div>
  );
}
