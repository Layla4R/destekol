"use client";
import { VERIFY_EMAIL_COPY } from "@/lib/verify-email-copy";
import Link from "next/link";
import { useParams,useRouter,useSearchParams } from "next/navigation";
import { Suspense,useEffect,useRef,useState } from "react";
function VerifyEmailContent() {
    const locale = String(useParams().locale || "en");
    const copy = VERIFY_EMAIL_COPY[locale as keyof typeof VERIFY_EMAIL_COPY] || VERIFY_EMAIL_COPY.en;
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");
    // 🌟 منع تكرار طلب التفعيل في وضع التطوير (React Strict Mode)
    const isCalled = useRef(false);
    useEffect(() => {
        if (!token) {
            setStatus("error");
            setErrorMsg(copy.invalid);
            return;
        }
        if (isCalled.current)
            return;
        isCalled.current = true;
        async function handleVerify() {
            try {
                const res = await fetch("/api/donor/verify-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                const data = await res.json();
                if (!res.ok)
                    throw new Error(data.error);
                setStatus("success");
                setTimeout(() => {
                    router.push(`/${locale}/login`);
                }, 3000);
            }
            catch (err: any) {
                setStatus("error");
                setErrorMsg(err.message === "TOKEN_EXPIRED" ? copy.expired : err.message === "INVALID_TOKEN" ? copy.invalid : copy.error);
            }
        }
        handleVerify();
    }, [token, router, locale, copy]);
    return (<div className="max-w-md w-full bg-white p-8 rounded-2xl border border-line shadow-xl text-center font-sans">
      {status === "loading" && (<div>
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
          <h2 className="text-lg font-bold text-ink">{copy.loading}</h2>
        </div>)}

      {status === "success" && (<div>
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-emerald-600 mb-2">{copy.success}</h2>
          <p className="text-xs text-muted mb-6">{copy.redirect}</p>
          <Link href={`/${locale}/login`} className="inline-block bg-brand text-white text-xs font-bold px-6 py-3 rounded-xl hover:opacity-90 transition">
            {copy.login}
          </Link>
        </div>)}

      {status === "error" && (<div>
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">{copy.failed}</h2>
          <p className="text-xs text-muted mb-6">{errorMsg}</p>
          <Link href={`/${locale}/login`} className="inline-block bg-brand text-white text-xs font-bold px-6 py-3 rounded-xl hover:opacity-90 transition">
            {copy.back}
          </Link>
        </div>)}
    </div>);
}
export default function VerifyEmailPage() {
    const locale = String(useParams().locale || "en");
    const copy = VERIFY_EMAIL_COPY[locale as keyof typeof VERIFY_EMAIL_COPY] || VERIFY_EMAIL_COPY.en;
    return (<div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-muted">{copy.pageLoading}</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>);
}
