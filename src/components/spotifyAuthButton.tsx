import { signIn, signOut, useSession } from "next-auth/react";

export function SpotifyAuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <button className="btn btn-ghost loading" disabled>
        Loading...
      </button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {session.user?.name ?? session.user?.email}
        </span>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => signOut()}
          type="button">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn btn-primary"
      onClick={() => signIn("spotify")}
      type="button">
      Sign in with Spotify
    </button>
  );
}
