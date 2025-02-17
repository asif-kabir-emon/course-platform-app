"use client";
import { Form } from "@/components/Form/Form";
import TextInput from "@/components/Form/TextInput";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useResetPasswordMutation } from "@/redux/api/authApi";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const updatePasswordSchema = z.object({
  oldPassword: z
    .string({
      message: "Old password is required",
    })
    .min(8, {
      message: "Old password must be at least 8 characters",
    }),
  newPassword: z.string().min(8, {
    message: "New password must be at least 8 characters",
  }),
  confirmPassword: z.string().min(8, {
    message: "Confirm password must be at least 8 characters",
  }),
});

const updatePasswordValues = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const ChangePasswordPage = () => {
  const [resetPassword, { isLoading: isUpdating }] = useResetPasswordMutation();

  const form = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: updatePasswordValues,
  });

  const oldPassword = form.watch("oldPassword");
  const newPassword = form.watch("newPassword");
  const confirmPassword = form.watch("confirmPassword");

  const handleSubmit = async (values: z.infer<typeof updatePasswordSchema>) => {
    if (values.newPassword !== values.confirmPassword) {
      toast.error("Passwords do not match!", { duration: 2000 });
      return;
    }

    const payload = {
      requestType: "change_password",
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    };

    const toastId = toast.loading("Updating Password...", {
      duration: 2000,
      position: "top-center",
    });

    try {
      const response = await resetPassword(payload).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
        form.reset();
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      }
    } catch {
      toast.error("Failed to change!", { id: toastId, duration: 2000 });
    }
  };

  return (
    <div>
      <PageHeader title="Change Password" />
      <Form schema={updatePasswordSchema} {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {oldPassword === newPassword && oldPassword !== "" && (
            <div>
              <p className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
                New password must be different from old password
              </p>
            </div>
          )}

          {newPassword !== confirmPassword &&
            newPassword !== "" &&
            confirmPassword !== "" && (
              <div>
                <p className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
                  New password and confirm password must match
                </p>
              </div>
            )}

          <TextInput
            name="oldPassword"
            label="Old Password"
            placeholder="Enter your old password"
            required
          />
          <TextInput
            name="newPassword"
            label="New Password"
            placeholder="Enter your new password"
            required
          />
          <TextInput
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your new password"
            required
          />
          <Button
            type="submit"
            disabled={
              isUpdating ||
              oldPassword === "" ||
              newPassword === "" ||
              confirmPassword === "" ||
              oldPassword === newPassword ||
              newPassword !== confirmPassword
            }
            className="px-6"
          >
            Save
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ChangePasswordPage;
