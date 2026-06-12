"use client";
import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";
import { AuthCardSkeleton } from "@/components/Skeleton";

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
