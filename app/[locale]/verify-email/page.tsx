"use client";
import Link from "next/link";
import { useRouter,useSearchParams } from "next/navigation";
import { Suspense,useEffect,useRef,useState } from "react";
function VerifyEmailContent() {
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
            setErrorMsg("رابط التفعيل غير صالح أو مفقود.");
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
                    router.push("/login");
                }, 3000);
            }
            catch (err: any) {
                setStatus("error");
                setErrorMsg(err.message || "حدث خطأ أثناء تفعيل الحساب.");
            }
        }
        handleVerify();
    }, [token, router]);
    return (<div className="max-w-md w-full bg-white p-8 rounded-2xl border border-line shadow-xl text-center font-sans">
      {status === "loading" && (<div>
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
          <h2 className="text-lg font-bold text-ink">جاري التحقق وتفعيل حسابك...</h2>
        </div>)}

      {status === "success" && (<div>
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-emerald-600 mb-2">تم تفعيل حسابك بنجاح!</h2>
          <p className="text-xs text-muted mb-6">سيتم تحويلك لصفحة تسجيل الدخول خلال ثوانٍ...</p>
          <Link href="/login" className="inline-block bg-brand text-white text-xs font-bold px-6 py-3 rounded-xl hover:opacity-90 transition">
            تسجيل الدخول الآن
          </Link>
        </div>)}

      {status === "error" && (<div>
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            ✕
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">تعذر تفعيل الحساب</h2>
          <p className="text-xs text-muted mb-6">{errorMsg}</p>
          <Link href="/login" className="inline-block bg-brand text-white text-xs font-bold px-6 py-3 rounded-xl hover:opacity-90 transition">
            العودة لتسجيل الدخول
          </Link>
        </div>)}
    </div>);
}
export default function VerifyEmailPage() {
    return (<div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-muted">جاري تحميل الصفحة...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>);
}
