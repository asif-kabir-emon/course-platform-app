"use client";
import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;
