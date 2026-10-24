import { permanentRedirect } from "next/navigation";

export default function GoogleVerificationPage({ params: { locale } }: { params: { locale: string } }) {
    // The association's public identity is managed in the admin About page.
    permanentRedirect(`/${locale}/about`);
}
