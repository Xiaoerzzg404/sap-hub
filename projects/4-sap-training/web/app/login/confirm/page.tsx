import { Suspense } from "react";
import { ConfirmLoginClient } from "./ConfirmLoginClient";

export default function ConfirmLoginPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmLoginClient />
    </Suspense>
  );
}
