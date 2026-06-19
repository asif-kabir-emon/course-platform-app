"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  useCreateStaffMutation,
  useDeleteStaffMutation,
  useGetStaffQuery,
  useUpdateStaffStatusMutation,
} from "@/hooks/staff.hook";
import { useClientSession } from "@/hooks/useClientSession";
import { cn } from "@/lib/utils";
import { CreateStaffPayload } from "@/service/staff.service";
import {
  KeyRound,
  Loader2,
  MoreHorizontal,
  Power,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";

type StaffMember = {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    imageUrl?: string | null;
  } | null;
};

type StaffAction = "disable" | "restore" | "reset_password";

const StaffPage = () => {
  const { session, isReady } = useClientSession();
  const { data: staffResponse, isLoading } = useGetStaffQuery();
  const [updateStaffStatus, { isLoading: isUpdatingStaff }] =
    useUpdateStaffStatusMutation();
  const [deleteStaff, { isLoading: isDeletingStaff }] =
    useDeleteStaffMutation();
  const staff = (staffResponse?.data ?? []) as StaffMember[];

  const handleStaffAction = async ({
    id,
    action,
    password,
  }: {
    id: string;
    action: StaffAction;
    password?: string;
  }) => {
    const toastId = toast.loading(getActionLoadingText(action));

    try {
      const response = await updateStaffStatus({
        id,
        action,
        password,
      }).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId });
      } else {
        toast.error(response.message, { id: toastId });
      }
    } catch {
      toast.error("Failed to update staff account.", { id: toastId });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    const toastId = toast.loading("Deleting staff account...");

    try {
      const response = await deleteStaff(id).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId });
      } else {
        toast.error(response.message, { id: toastId });
      }
    } catch {
      toast.error("Failed to delete staff account.", { id: toastId });
    }
  };

  if (!isReady) {
    return (
      <div className="page-shell">
        <div className="skeleton-shimmer h-96 rounded-2xl" />
      </div>
    );
  }

  if (session?.role !== "super_admin") {
    return (
      <div className="page-shell">
        <div className="error-panel">
          Only super admins can manage staff accounts.
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <section className="surface-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">
              Super admin
            </Badge>
            <h1 className="text-3xl font-bold tracking-normal">
              Staff accounts
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Create admin staff accounts, review current staff, and control
              platform access from one place.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
              <UsersRound className="size-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{staff.length}</p>
                <p className="text-sm text-muted-foreground">staff accounts</p>
              </div>
            </div>
            <CreateStaffDialog />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1 text-xl">
            <ShieldCheck className="size-5 text-primary" />
            Staff list
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="skeleton-shimmer h-20 rounded-xl" />
              ))}
            </div>
          ) : staff.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No staff accounts have been created yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_8rem] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground md:grid">
                <span>Staff</span>
                <span>Contact</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y">
                {staff.map((member) => (
                  <StaffRow
                    key={member.id}
                    member={member}
                    isBusy={isUpdatingStaff || isDeletingStaff}
                    onAction={handleStaffAction}
                    onDelete={handleDeleteStaff}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CreateStaffDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [createStaff, { isLoading: isCreatingStaff }] =
    useCreateStaffMutation();
  const form = useForm<CreateStaffPayload>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: generatePassword(),
    },
  });

  const handleCreateStaff = async (values: CreateStaffPayload) => {
    const toastId = toast.loading("Creating staff account...");

    try {
      const response = await createStaff({
        ...values,
        email: values.email.trim().toLowerCase(),
      }).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId });
        form.reset({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: generatePassword(),
        });
        setIsOpen(false);
      } else {
        toast.error(response.message, { id: toastId });
      }
    } catch {
      toast.error("Failed to create staff account.", { id: toastId });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          New staff account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create staff account</DialogTitle>
          <DialogDescription>
            Staff accounts are created as admins and can manage platform
            content.
          </DialogDescription>
        </DialogHeader>
        <StaffAccountForm
          form={form}
          submitLabel="Create staff account"
          isSubmitting={isCreatingStaff}
          onSubmit={handleCreateStaff}
        />
      </DialogContent>
    </Dialog>
  );
};

const ResetPasswordDialog = ({
  member,
  isUpdating,
  onAction,
  children,
}: {
  member: StaffMember;
  isUpdating: boolean;
  onAction: (payload: {
    id: string;
    action: StaffAction;
    password?: string;
  }) => Promise<void>;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<Pick<CreateStaffPayload, "password">>({
    defaultValues: {
      password: generatePassword(),
    },
  });
  const password = useWatch({
    control: form.control,
    name: "password",
  });

  const handleResetPassword = async ({
    password,
  }: Pick<CreateStaffPayload, "password">) => {
    await onAction({
      id: member.id,
      action: "reset_password",
      password,
    });
    form.reset({ password: generatePassword() });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset staff password</DialogTitle>
          <DialogDescription>
            Set a new temporary password for {getStaffName(member)}.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleResetPassword)}
          className="space-y-4"
        >
          <PasswordField
            value={password}
            onGenerate={() =>
              form.setValue("password", generatePassword(), {
                shouldValidate: true,
              })
            }
            inputProps={form.register("password", {
              required: "Password is required.",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters.",
              },
            })}
          />
          <FieldError message={form.formState.errors.password?.message} />
          <Button type="submit" className="w-full" disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            Reset password
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const DeleteStaffDialog = ({
  member,
  isBusy,
  onDelete,
  children,
}: {
  member: StaffMember;
  isBusy: boolean;
  onDelete: (id: string) => Promise<void>;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    await onDelete(member.id);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete staff account?</DialogTitle>
          <DialogDescription>
            This permanently removes {getStaffName(member)} from staff access.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDelete}
            disabled={isBusy}
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StaffAccountForm = ({
  form,
  submitLabel,
  isSubmitting,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<CreateStaffPayload>>;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: CreateStaffPayload) => Promise<void>;
}) => {
  const password = useWatch({
    control: form.control,
    name: "password",
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 pt-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            placeholder="First name"
            {...form.register("firstName", {
              required: "First name is required.",
            })}
          />
          <FieldError message={form.formState.errors.firstName?.message} />
        </div>
        <div>
          <Input
            placeholder="Last name"
            {...form.register("lastName", {
              required: "Last name is required.",
            })}
          />
          <FieldError message={form.formState.errors.lastName?.message} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Input
            type="email"
            placeholder="Email address"
            {...form.register("email", {
              required: "Email is required.",
            })}
          />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <Input placeholder="Phone (optional)" {...form.register("phone")} />
      </div>
      <div>
        <PasswordField
          value={password}
          onGenerate={() =>
            form.setValue("password", generatePassword(), {
              shouldValidate: true,
            })
          }
          inputProps={form.register("password", {
            required: "Password is required.",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters.",
            },
          })}
        />
        <FieldError message={form.formState.errors.password?.message} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {submitLabel}
      </Button>
    </form>
  );
};

const PasswordField = ({
  value,
  onGenerate,
  inputProps,
}: {
  value: string;
  onGenerate: () => void;
  inputProps: UseFormRegisterReturn;
}) => (
  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
    <Input
      type="text"
      placeholder="Temporary password"
      value={value}
      {...inputProps}
    />
    <Button type="button" variant="outline" onClick={onGenerate}>
      <Sparkles className="size-4" />
      Generate
    </Button>
  </div>
);

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;

  return <p className="mt-1 text-sm text-destructive">{message}</p>;
};

const StaffRow = ({
  member,
  isBusy,
  onAction,
  onDelete,
}: {
  member: StaffMember;
  isBusy: boolean;
  onAction: (payload: {
    id: string;
    action: StaffAction;
    password?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const name = getStaffName(member);
  const statusAction = member.isDeleted ? "restore" : "disable";

  return (
    <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_8rem] md:items-center">
      <div className="min-w-0">
        <p className="truncate font-semibold">{name}</p>
        <p className="mt-1 text-xs capitalize text-muted-foreground">
          {member.role.replace("_", " ")} • Joined{" "}
          {formatDate(member.createdAt)}
        </p>
      </div>
      <div className="min-w-0 text-sm text-muted-foreground">
        <p className="truncate">{member.email}</p>
        {member.profile?.phone && (
          <p className="mt-1 truncate">{member.profile.phone}</p>
        )}
      </div>
      <Badge
        variant="outline"
        className={cn(
          "w-fit",
          member.isDeleted
            ? "border-destructive/30 bg-destructive/5 text-destructive"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
        )}
      >
        {member.isDeleted ? "Disabled" : "Active"}
      </Badge>
      <div className="flex justify-start md:justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open staff actions"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() =>
                onAction({
                  id: member.id,
                  action: statusAction,
                })
              }
              disabled={isBusy}
            >
              {member.isDeleted ? (
                <RotateCcw className="size-4" />
              ) : (
                <Power className="size-4" />
              )}
              {member.isDeleted ? "Mark active" : "Disable account"}
            </DropdownMenuItem>
            <ResetPasswordDialog
              member={member}
              isUpdating={isBusy}
              onAction={onAction}
            >
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <KeyRound className="size-4" />
                Reset password
              </DropdownMenuItem>
            </ResetPasswordDialog>
            <DeleteStaffDialog
              member={member}
              isBusy={isBusy}
              onDelete={onDelete}
            >
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(event) => event.preventDefault()}
              >
                <Trash2 className="size-4" />
                Delete account
              </DropdownMenuItem>
            </DeleteStaffDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const getActionLoadingText = (action: StaffAction) => {
  if (action === "disable") return "Disabling staff account...";
  if (action === "restore") return "Restoring staff account...";
  return "Resetting staff password...";
};

const getStaffName = (member: StaffMember) =>
  `${member.profile?.firstName ?? ""} ${member.profile?.lastName ?? ""}`.trim() ||
  "Unnamed staff";

const generatePassword = () => {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

  return Array.from({ length: 14 }, () =>
    alphabet.charAt(Math.floor(Math.random() * alphabet.length)),
  ).join("");
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

export default StaffPage;
