import { Suspense } from "react";

export const dynamic = "force-dynamic";

import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterClient />
    </Suspense>
  );
}
