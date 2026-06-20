"use client";

import { Form } from "@/components/Form/Form";
import TextInput from "@/components/Form/TextInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileAvatarEditor from "@/features/profile/ProfileAvatarEditor";
import {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} from "@/hooks/profile.hook";
import { profileDefaultValues, profileSchema } from "@/schema/profile.schema";
import { authKey } from "@/constants/AuthKey.constant";
import { notifyClientSessionChanged } from "@/lib/clientSession";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { ArrowLeft, ImageIcon, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function UpdateProfilePage() {
  const { data: profileInfo, isLoading } = useGetUserProfileQuery({});
  if (isLoading)
    return <div className="skeleton-shimmer h-[32rem] rounded-3xl" />;
  if (!profileInfo?.success)
    return <div className="error-panel">Failed to load your profile.</div>;
  return <ProfileForm profileInfo={profileInfo.data.profile} />;
}

function ProfileForm({
  profileInfo,
}: {
  profileInfo: { firstName?: string; lastName?: string; imageUrl?: string };
}) {
  const router = useRouter();
  const [updateProfile, { isLoading }] = useUpdateUserProfileMutation();
  const fullName =
    [profileInfo.firstName, profileInfo.lastName].filter(Boolean).join(" ") ||
    "Account";
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ...profileDefaultValues,
      firstName: profileInfo.firstName || "",
      lastName: profileInfo.lastName || "",
    },
  });

  const submit = async (values: z.infer<typeof profileSchema>) => {
    const toastId = toast.loading("Saving your details…");
    try {
      const response = await updateProfile(values).unwrap();
      if (!response.success)
        return toast.error(response.message, { id: toastId });
      Cookies.set(authKey, response.data.accessToken, {
        path: "/",
        secure: true,
        sameSite: "strict",
        expires: 28,
      });
      notifyClientSessionChanged();
      toast.success(response.message, { id: toastId });
      router.push("/profile");
    } catch {
      toast.error("Failed to update your profile.", { id: toastId });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile" aria-label="Back to profile">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
          <p className="text-sm text-muted-foreground">
            Update your photo and personal details.
          </p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit overflow-hidden">
          <div className="h-24 bg-gradient-to-br from-primary to-violet-500" />
          <CardContent className="-mt-12 flex flex-col items-center px-6 pb-7 text-center">
            <ProfileAvatarEditor
              imageUrl={profileInfo.imageUrl}
              name={fullName}
              size="medium"
            />
            <h2 className="mt-4 text-lg font-semibold">{fullName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Click the photo to upload, crop, and replace it.
            </p>
            {/* <div className="mt-5 flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-left text-xs leading-5 text-muted-foreground">
              <ImageIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                Your crop is uploaded as a 512 × 512 image and replaces your
                previous Cloudinary asset.
              </span>
            </div> */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" /> Personal details
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Use the name you want displayed across the learning platform.
            </p>
          </CardHeader>
          <CardContent>
            <Form schema={profileSchema} {...form}>
              <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextInput
                    name="firstName"
                    label="First name"
                    placeholder="Enter your first name"
                    required
                  />
                  <TextInput
                    name="lastName"
                    label="Last name"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" asChild>
                    <Link href="/profile">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    <Save className="size-4" />{" "}
                    {isLoading ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
