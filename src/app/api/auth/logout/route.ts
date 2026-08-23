import { NextResponse } from "next/server";
import { clearAuthCookie } from "../../utils/authCookie";

export async function POST(): Promise<Response> {
  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
}
