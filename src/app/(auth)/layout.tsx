import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center my-10 mx-5">
      {children}
    </div>
  );
}
