import { redirect } from "next/navigation";

export default function Home() {
  // Always send traffic straight to the login flow so the single source of auth logic is /login.
  redirect("/login");
}
