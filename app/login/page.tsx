import { redirect } from "next/navigation";

// The old standalone /login page is retired. The landing page "/" is the sign-in
// surface now. Middleware also redirects /login -> /; this is the belt-and-braces
// fallback so the route never renders the legacy login UI.
export default function LoginPage() {
  redirect("/");
}
