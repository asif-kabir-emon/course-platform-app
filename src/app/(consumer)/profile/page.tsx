"use client";
import PageHeader from "@/components/PageHeader";
import { SkeletonButton, SkeletonText } from "@/components/Skeleton";
import { Button } from "@/components/ui/button";
import { useGetUserProfileQuery } from "@/redux/api/profileApi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

const ProfilePage = () => {
  const router = useRouter();

  return (
    <div className="md:container">
      <PageHeader title="Profile Info">
        <Button
          onClick={() => {
            router.push("/profile/update");
          }}
        >
          Edit Profile
        </Button>
      </PageHeader>
      <ProfileInfo />
    </div>
  );
};

export default ProfilePage;

const ProfileInfo = () => {
  const { data: profileInfo, isLoading } = useGetUserProfileQuery({});

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (profileInfo.success === false) {
    return (
      <div className="border border-l-[5px] border-l-red-600 mb-4 px-4 py-4 rounded-r-md text-sm text-muted-foreground">
        Failed to fetch data. Try to refresh the page.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-7">
        <div className="relative rounded-lg overflow-hidden">
          {profileInfo.data.profile.imageUrl && (
            <Image
              src={profileInfo.data.profile.imageUrl}
              alt="User"
              className="w-80 h-80 rounded-lg aspect-square object-cover"
              width="400"
              height="400"
            />
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-col">
            <div className="text-sm">First Name</div>
            <div className="text-lg font-bold">
              {profileInfo.data.profile.firstName}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-sm">Last Name</div>
            <div className="text-lg font-bold">
              {profileInfo.data.profile.lastName}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="text-sm">Email</div>
            <div className="text-lg font-bold">
              {profileInfo.data.profile.email}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfilePageSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((item) => (
        <div key={item} className="space-y-1">
          <SkeletonText className="w-40 h-2" />
          <SkeletonButton className="w-1/2" />
        </div>
      ))}
    </div>
  );
};
