// app/components/Header.tsx
import { auth } from "@/auth";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const session = await auth();
  const isAuthed = !!session?.user;

  return <HeaderClient isAuthed={isAuthed} />;
}
