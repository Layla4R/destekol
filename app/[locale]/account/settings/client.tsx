"use client";
import { interfaceCopy } from "@/lib/interface-copy";

import Icon from "@/components/icons";
import { countries } from "countries-list";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect,useMemo,useRef,useState } from "react";
const getFlagEmoji = (code: string) => {
    if (!code)
        return "";
    return code
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
};
export default function SettingsClient({ locale, dict: D, }: {
    locale: string;
    dict: Record<string, string>;
}) {
    const router = useRouter();
    const p = locale === "ar" ? "" : `/${locale}`;
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{
        ok: boolean;
        msg: string;
    } | null>(null);
    const [form, setForm] = useState({
        name: "",
        country: "",
        curPw: "",
        newPw: "",
        confirm: "",
    });
    const [countryOpen, setCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        setMounted(true);
        fetch("/api/donor/me")
            .then((r) => r.json())
            .then((d) => {
            if (!d.user) {
                router.push(`${p}/login`);
                return;
            }
            setForm((f) => ({
                ...f,
                name: d.user.name || "",
                country: d.user.country || "",
            }));
            setLoading(false);
        })
            .catch(() => router.push(`${p}/login`));
    }, [p, router]);
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
    const countryList = useMemo(() => {
        if (typeof window === "undefined")
            return [];
        try {
            const regionNames = new Intl.DisplayNames([locale || "ar"], {
                type: "region",
            });
            return Object.entries(countries)
                .map(([code, c]) => {
                let cName = c.name;
                try {
                    cName = regionNames.of(code) || c.name;
                }
                catch {
                    cName = c.name;
                }
                return { code, name: cName, flag: getFlagEmoji(code) };
            })
                .sort((a, b) => a.name.localeCompare(b.name, locale || "ar"));
        }
        catch {
            return [];
        }
    }, [locale]);
    const filteredCountries = useMemo(() => {
        if (!countrySearch)
            return countryList;
        return countryList.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
    }, [countryList, countrySearch]);
    const selectedCountryObj = useMemo(() => {
        return countryList.find((c) => c.name === form.country);
    }, [countryList, form.country]);
    async function save(e: React.FormEvent) {
        e.preventDefault();
        if (form.newPw && form.newPw !== form.confirm) {
            setStatus({
                ok: false,
                msg: D["auth.password_mismatch"] || "كلمتا المرور غير متطابقتين",
            });
            return;
        }
        setSaving(true);
        setStatus(null);
        try {
            const res = await fetch("/api/donor/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    country: form.country,
                    currentPassword: form.curPw || undefined,
                    newPassword: form.newPw || undefined,
                }),
            });
            const d = await res.json();
            setStatus(d.ok
                ? { ok: true, msg: D["account.saved"] || "تم حفظ التغييرات بنجاح!" }
                : { ok: false, msg: d.error || "حدث خطأ أثناء الحفظ" });
            if (d.ok) {
                setForm((f) => ({ ...f, curPw: "", newPw: "", confirm: "" }));
                router.refresh();
            }
        }
        catch {
            setStatus({ ok: false, msg: "حدث خطأ في الاتصال بالخادم" });
        }
        finally {
            setSaving(false);
        }
    }
    const inp = "w-full rounded-xl border border-line bg-cream py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 transition";
    if (loading)
        return (<div className="min-h-[50vh] flex items-center justify-center text-muted font-medium">
        {D["common.loading"] || "جاري التحميل..."}
      </div>);
    return (<div className="max-w-xl mx-auto px-6 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`${p}/account`} aria-label={D["account.back_to_account"] || "العودة للحساب"} className="p-2 rounded-xl border border-line hover:border-brand text-muted hover:text-ink transition">
          <Icon name={locale === "ar" ? "arrow-right" : "arrow-left"} size={20}/>
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          {D["account.settings"] || "إعدادات الحساب"}
        </h1>
      </div>

      <form onSubmit={save} className="space-y-6" autoComplete="off">
        <div className="bg-white rounded-xl2 border border-line p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm text-muted mb-1.5 font-medium">
              {D["auth.name"] || "الاسم الكامل"}
            </label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inp}/>
          </div>

          {/* القائمة المنسدلة الاحترافية للدول */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm text-muted mb-1.5 font-medium">
              {D["auth.country"] || "الدولة"}
            </label>
            <button type="button" onClick={() => setCountryOpen(!countryOpen)} className={`${inp} flex items-center justify-between text-start cursor-pointer hover:border-brand/50`}>
              <span className="flex items-center gap-2 truncate">
                {selectedCountryObj ? (<>
                    <span className="text-base">{selectedCountryObj.flag}</span>
                    <span className="text-ink font-medium">
                      {selectedCountryObj.name}
                    </span>
                  </>) : form.country ? (<span className="text-ink font-medium">{form.country}</span>) : (<span className="text-muted">
                    {D["auth.select_country"] || interfaceCopy(locale).selectCountry}
                  </span>)}
              </span>
              <Icon name="chevron-down" size={16} className={`text-muted transition-transform duration-200 ${countryOpen ? "rotate-180 text-brand" : ""}`}/>
            </button>

            {countryOpen && (<div className="absolute z-50 top-full mt-1.5 w-full bg-white rounded-xl border border-line shadow-2xl overflow-hidden animate-in fade-in duration-150">
                <div className="p-2 border-b border-line bg-cream/40">
                  <input type="text" placeholder={D["auth.search_country"] || interfaceCopy(locale).searchCountry} value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-line bg-white focus:outline-none focus:ring-2 focus:ring-brand/30" autoFocus/>
                </div>

                <div className="max-h-52 overflow-y-auto divide-y divide-line/30">
                  {mounted && filteredCountries.length > 0 ? (filteredCountries.map((c) => (<button key={c.code} type="button" onClick={() => {
                    setForm((f) => ({ ...f, country: c.name }));
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
                      {D["common.no_results"]}
                    </div>)}
                </div>
              </div>)}
          </div>
        </div>

        <div className="bg-white rounded-xl2 border border-line p-6 space-y-4 shadow-sm">
          <h2 className="text-xs text-muted font-bold uppercase tracking-wider">
            {D["account.change_password"] || "تغيير كلمة المرور"}
          </h2>
          <div>
            <label className="block text-sm text-muted mb-1.5 font-medium">
              {D["account.current_password"] || "كلمة المرور الحالية"}
            </label>
            <input type="password" value={form.curPw} onChange={(e) => setForm((f) => ({ ...f, curPw: e.target.value }))} className={inp}/>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5 font-medium">
              {D["account.new_password"] || "كلمة المرور الجديدة"}
            </label>
            <input type="password" value={form.newPw} onChange={(e) => setForm((f) => ({ ...f, newPw: e.target.value }))} className={inp}/>
          </div>
          <div>
            <label className="block text-sm text-muted mb-1.5 font-medium">
              {D["account.confirm_password"] || "تأكيد كلمة المرور الجديدة"}
            </label>
            <input type="password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} className={inp}/>
          </div>
        </div>

        {status && (<div className={`flex items-center gap-2 rounded-xl p-3.5 text-sm font-semibold border ${status.ok
                ? "bg-success/10 text-success border-success/20"
                : "bg-danger/10 text-danger border-danger/20"}`}>
            <Icon name={status.ok ? "check" : "x"} size={15}/>
            {status.msg}
          </div>)}

        <button type="submit" disabled={saving} className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-3.5 transition disabled:opacity-60 flex items-center justify-center gap-2">
          <Icon name="shield-check" size={16}/>
          {saving
            ? D["account.saving"] || "جاري الحفظ..."
            : D["account.save"] || "حفظ التغييرات"}
        </button>
      </form>
    </div>);
}
