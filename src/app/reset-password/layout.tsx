import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Pub DB account.",
  robots: { index: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
