// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { nanoid } from "nanoid";

// This function can be marked `async` if using `await` inside
export function middleware(req: NextRequest) {
    if (req.cookies.get("user-token")) return;

    const random = nanoid();

    // Redirect (to apply cookie)
    const res = NextResponse.redirect(req.nextUrl);

    res.cookies.set("user-token", random, { sameSite: "strict" });

    return res;
}
