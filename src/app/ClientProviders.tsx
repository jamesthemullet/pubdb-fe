"use client";
import { SessionProvider } from "next-auth/react";
import NavBar from "./NavBar";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <NavBar />
      {children}
    </SessionProvider>
  );
}
