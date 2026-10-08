"use client";
import PrivacyNotice from '@/components/site/PrivacyNotice';
import { interfaceCopy } from "@/lib/interface-copy";

import Icon from "@/components/icons";
import { countries } from "countries-list";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useMemo,useRef,useState } from "react";
// دالة تحويل رمز الدولة إلى علم Emoji
const getFlagEmoji = (code: string) => {
    if (!code)
        return "";
    return code
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
};
// دالة معالجة الاستجابات بأمان لمنع خطأ Unexpected token <
async function parseJsonResponse(res: Response) {
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error("حدث خطأ في السيرفر، يرجى المحاولة لاحقاً");
    }
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "حدث خطأ غير متوقع");
    }
    return data;
}
export default function LoginClient({ locale, dict: D, }: {
    locale: string;
    dict: Record<string, string>;
}) {
    const router = useRouter();
    const p = locale === "ar" ? "" : `/${locale}`;
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const [tab, setTab] = useState<"login" | "register">("login");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirm: "",
        country: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    // حالات القائمة المنسدلة الاحترافية للدول
    const [countryOpen, setCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [successMsg, setSuccessMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
    // إغلاق القائمة عند الضغط خارجها
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)) {
                setCountryOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    // جلب وتنسيق قائمة الدول
    const countryList = useMemo(() => {
        if (typeof window === "undefined")
            return [];
        try {
            const regionNames = new Intl.DisplayNames([locale || "ar"], {
                type: "region",
            });
            return Object.entries(countries)
                .map(([code, country]) => {
                let name = country.name;
                try {
                    name = regionNames.of(code) || country.name;
                }
                catch {
                    name = country.name;
                }
                return {
                    code,
                    name,
                    flag: getFlagEmoji(code),
                };
            })
                .sort((a, b) => a.name.localeCompare(b.name, locale || "ar"));
        }
        catch {
            return [];
        }
    }, [locale]);
    // تصفية الدول حسب نص البحث
    const filteredCountries = useMemo(() => {
        if (!countrySearch)
            return countryList;
        return countryList.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
    }, [countryList, countrySearch]);
    // الدولة المحددة حالياً
    const selectedCountryObj = useMemo(() => {
        return countryList.find((c) => c.name === form.country);
    }, [countryList, form.country]);
    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/donor/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, password: form.password }),
            });
            await parseJsonResponse(res);
            router.push(`${p}/account`);
            router.refresh();
        }
        catch (e: any) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        if (form.password !== form.confirm) {
            setError(D["auth.password_mismatch"] || "كلمتا المرور غير متطابقتين");
            return;
        }
        if (form.password.length < 8) {
            setError(D["auth.password_short"] || "كلمة المرور يجب أن تكون 8 أحرف على الأقل");
            return;
        }
        setError("");
        setSuccessMsg("");
        setLoading(true);
        try {
            const regRes = await fetch("/api/donor/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    country: form.country,
                }),
            });
            await parseJsonResponse(regRes);
            setSuccessMsg("تم إنشاء حسابك بنجاح! أرسلنا رابط التفعيل إلى بريدك الإلكتروني، يرجى مراجعة صندوق الوارد (أو الرسائل غير المرغوبة) لتأكيد حسابك.");
            setForm({ name: "", email: "", password: "", confirm: "", country: "" });
        }
        catch (e: any) {
            setError(e.message);
        }
        finally {
            setLoading(false);
        }
    }
    const inp = "w-full rounded-xl border border-line bg-cream py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition";
    return (<div className="relative min-h-[80vh] flex items-center justify-center bg-section-gradient px-6 py-16 overflow-hidden" suppressHydrationWarning>
      <div className="relative bg-white rounded-2xl shadow-2xl border border-line p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Link href={`${p}/`}>
            <Image src="/brand/logo-horizontal-transparent.png" alt="Destekol" width={180} height={72} className="h-11 w-auto object-contain mx-auto mb-5"/>
          </Link>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            {tab === "login" ? D["auth.login"] : D["auth.register"]}
          </h1>
        </div>

        <div className="flex rounded-xl overflow-hidden border border-line mb-6 text-sm font-bold">
          <button type="button" onClick={() => {
            setTab("login");
            setError("");
        }} className={`flex-1 py-2.5 transition ${tab === "login"
            ? "bg-brand text-white"
            : "bg-white text-muted hover:bg-beige"}`}>
            {D["auth.sign_in"]}
          </button>
          <button type="button" onClick={() => {
            setTab("register");
            setError("");
        }} className={`flex-1 py-2.5 transition ${tab === "register"
            ? "bg-brand text-white"
            : "bg-white text-muted hover:bg-beige"}`}>
            {D["auth.create_account"]}
          </button>
        </div>

        <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-4" autoComplete="off" suppressHydrationWarning>
          {tab === "register" && (<>
              <div>
                <label className="block text-sm text-muted mb-1.5">
                  {D["auth.name"]} *
                </label>
                <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inp}/>
              </div>

              {/* قائمة اختيار الدولة الاحترافية */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm text-muted mb-1.5">
                  {D["auth.country"]}
                </label>
                <button type="button" onClick={() => setCountryOpen(!countryOpen)} className={`${inp} flex items-center justify-between text-start cursor-pointer hover:border-brand/50`}>
                  <span className="flex items-center gap-2 truncate">
                    {selectedCountryObj ? (<>
                        <span className="text-base">{selectedCountryObj.flag}</span>
                        <span className="text-ink font-medium">
                          {selectedCountryObj.name}
                        </span>
                      </>) : (<span className="text-muted">
                        {interfaceCopy(locale).selectCountry}
                      </span>)}
                  </span>
                  <Icon name="chevron-down" size={16} className={`text-muted transition-transform duration-200 ${countryOpen ? "rotate-180 text-brand" : ""}`}/>
                </button>

                {/* القائمة المنبثقة */}
                {countryOpen && (<div className="absolute z-50 top-full mt-1.5 w-full bg-white rounded-xl border border-line shadow-2xl overflow-hidden animate-in fade-in duration-150">
                    <div className="p-2 border-b border-line bg-cream/40">
                      <input type="text" placeholder={interfaceCopy(locale).searchCountry} value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-line bg-white focus:outline-none focus:ring-2 focus:ring-brand/30" autoFocus/>
                    </div>

                    <div className="max-h-52 overflow-y-auto divide-y divide-line/30">
                      {mounted && filteredCountries.length > 0 ? (filteredCountries.map((c) => (<button key={c.code} type="button" onClick={() => {
                        set("country", c.name);
                        setCountryOpen(false);
                        setCountrySearch("");
                    }} className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-start transition ${form.country === c.name
                        ? "bg-brand/10 font-bold text-brand"
                        : "text-ink hover:bg-cream/60"}`}>
                            <span className="flex items-center gap-2.5 truncate">
                              <span className="text-base">{c.flag}</span>
                              <span>{c.name}</span>
                            </span>
                            {form.country === c.name && (<Icon name="check" size={14} className="text-brand shrink-0"/>)}
                          </button>))) : (<div className="p-3 text-center text-xs text-muted">
                          {locale === "ar"
                        ? "لا توجد نتائج"
                        : "No results found"}
                        </div>)}
                    </div>
                  </div>)}
              </div>
            </>)}

          <div>
            <label className="block text-sm text-muted mb-1.5">
              {D["auth.email"]} *
            </label>
            <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inp}/>
          </div>

          <div>
            <label className="block text-sm text-muted mb-1.5">
              {D["auth.password"]} *
            </label>
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} className={`${inp} pe-11`}/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 end-3.5 text-muted hover:text-ink transition p-1" aria-label="عرض/إخفاء كلمة المرور">
                {showPassword ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                    <line x1="2" x2="22" y1="2" y2="22"/>
                  </svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>)}
              </button>
            </div>
          </div>

          {tab === "register" && (<div>
              <label className="block text-sm text-muted mb-1.5">
                {D["auth.confirm_password"]} *
              </label>
              <div className="relative">
                <input required type={showConfirm ? "text" : "password"} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} className={`${inp} pe-11`}/>
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute top-1/2 -translate-y-1/2 end-3.5 text-muted hover:text-ink transition p-1" aria-label="عرض/إخفاء تأكيد كلمة المرور">
                  {showConfirm ? (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" x2="22" y1="2" y2="22"/>
                    </svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>)}
                </button>
              </div>
            </div>)}

          {tab === "login" && (<div className="text-left">
              <Link href={`${p}/forgot-password`} className="text-xs text-brand hover:underline">
                {D["auth.forgot_password"]}
              </Link>
            </div>)}

          {error && (<p className="flex items-center gap-2 text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl p-3">
              <Icon name="x" size={14}/>
              {error}
            </p>)}
        {successMsg && (<div className="flex items-start gap-2 text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 leading-relaxed font-semibold">
    <Icon name="check" size={16} className="text-emerald-600 shrink-0 mt-0.5"/>
    <span>{successMsg}</span>
  </div>)}
          <PrivacyNotice locale={locale} purpose="account"/>
          <button type="submit" disabled={loading} className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-3.5 transition disabled:opacity-60">
            {loading
            ? "..."
            : tab === "login"
                ? D["auth.sign_in"]
                : D["auth.create_account"]}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-5">
          <Link href="/admin/login" className="text-brand hover:underline">
            {D["auth.admin_login"]}
          </Link>
        </p>
      </div>
    </div>);
}
