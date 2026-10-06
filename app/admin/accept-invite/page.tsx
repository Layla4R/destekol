import { Suspense } from "react";
import AcceptInviteClient from "./AcceptInviteClient";
export default function AcceptInvitePage() {
    return (<Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-brand-gradient text-white">Loading...</div>}>
      <AcceptInviteClient />
    </Suspense>);
}
