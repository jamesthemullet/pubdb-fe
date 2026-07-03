"use client";

import { useEffect } from "react";

export default function AccentedInit() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ACCENTED === "true") {
      import("accented").then(({ accented }) => accented());
    }
  }, []);

  return null;
}
