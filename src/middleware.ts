// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { nanoid } from "nanoid";

// This function can be marked `async` if using `await` inside
export function middleware(req: NextRequest) {
  if (req.cookies.get("user-token") && req.cookies.get("presence-token"))
    return;

  // Redirect (to apply cookie)
  const res = NextResponse.next();

  res.cookies.set("user-token", nanoid(), { sameSite: "strict" });
  res.cookies.set("presence-token", nanoid(), { sameSite: "strict" });

  return res;
}
