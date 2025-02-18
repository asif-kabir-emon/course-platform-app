"use client";
import { Form } from "@/components/Form/Form";
import TextInput from "@/components/Form/TextInput";
import PageHeader from "@/components/PageHeader";
import { SkeletonButton, SkeletonText } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} from "@/redux/api/profileApi";
import { profileDefaultValues, profileSchema } from "@/schema/profile.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Cookies from "js-cookie";
import { authKey } from "@/constants/AuthKey.constant";

const UpdateProfilePage = () => {
  const { data: profileInfo, isLoading } = useGetUserProfileQuery({});

  if (isLoading) {
    return <UpdateProfilePageSkeleton />;
  }

  if (profileInfo.success === false) {
    return (
      <div className="md:container">
        <PageHeader title="Update Profile" />
        <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
          Failed to fetch data. Try to refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="md:container">
      <PageHeader title="Update Profile" />
      <ProfileForm profileInfo={profileInfo.data.profile} />
    </div>
  );
};

export default UpdateProfilePage;

const ProfileForm = ({
  profileInfo,
}: {
  profileInfo: {
    firstName: string;
    lastName: string;
    photoUrl: string;
  };
}) => {
  const router = useRouter();
  const [updateProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileInfo ?? profileDefaultValues,
  });

  const [isValidImageUrl, setIsValidImageUrl] = useState(false);
  const imageUrl = form.watch("imageUrl");

  const handleSubmit = async (values: z.infer<typeof profileSchema>) => {
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      imageUrl: values.imageUrl ? values.imageUrl.trim() : "",
    };

    const toastId = toast.loading("Updating profile...", {
      duration: 2000,
      position: "top-center",
    });

    try {
      const response = await updateProfile(payload).unwrap();

      if (response.success) {
        toast.success(response.message, { id: toastId, duration: 2000 });
        if (response.data.accessToken) {
          Cookies.set(authKey, response.data.accessToken, {
            path: "/",
            secure: true,
            sameSite: "strict",
            expires: 28,
          });

          sessionStorage.setItem(
            authKey,
            JSON.stringify({
              authKey: response.data.accessToken,
              expiry: new Date().getTime() + 28 * 24 * 60 * 60 * 1000,
              isVerified: response.data.isVerified,
            }),
          );
        }
        router.push("/profile");
      } else {
        toast.error(response.message, { id: toastId, duration: 2000 });
      }
    } catch {
      toast.error("Failed to update profile!", { id: toastId, duration: 2000 });
    }
  };

  useEffect(() => {
    const validateImage = async () => {
      if (!imageUrl) return;
      try {
        const response = await fetch(imageUrl, { method: "HEAD" });
        if (
          response.ok &&
          response.headers.get("content-type")?.startsWith("image")
        ) {
          setIsValidImageUrl(true);
        } else {
          setIsValidImageUrl(false);
        }
      } catch {
        setIsValidImageUrl(false);
      }
    };

    validateImage();
  }, [imageUrl]);

  return (
    <Form schema={profileSchema} {...form}>
      {isValidImageUrl && imageUrl && (
        <div className="mb-10">
          <Image
            src={imageUrl.trim()}
            alt="User"
            className="rounded-lg aspect-square object-cover"
            width="200"
            height="200"
          />
        </div>
      )}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <TextInput
          name="firstName"
          label="First Name"
          placeholder="Enter your first name"
          required
        />
        <TextInput
          name="lastName"
          label="Last Name"
          placeholder="Enter your last name"
          required
        />
        <TextInput
          name="imageUrl"
          label="Photo URL"
          placeholder="Enter your photo URL"
          required
        />
        <Button
          type="submit"
          disabled={isUpdating || !isValidImageUrl}
          className="px-6"
        >
          Save
        </Button>
      </form>
    </Form>
  );
};

const UpdateProfilePageSkeleton = () => {
  return (
    <div className="md:container">
      <PageHeader title="Update Profile" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className="space-y-1">
            <SkeletonText className="w-40 h-2" />
            <SkeletonButton className="w-1/2" />
          </div>
        ))}
        <SkeletonButton />
      </div>
    </div>
  );
};
