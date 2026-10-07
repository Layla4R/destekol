import Image from 'next/image';

export default function DonationPageHeader({ locale, title, description }: { locale: string; title: string; description: string }) {
    return <header className="destekol-inner-page-banner" dir="ltr" aria-labelledby="donation-page-title">
        <Image src="/images/donation-header.png" alt="" fill priority sizes="100vw" className="destekol-inner-page-banner-image"/>
        <div className="destekol-inner-page-banner-overlay" aria-hidden="true"/>
        <div className="destekol-inner-page-banner-copy" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <h1 id="donation-page-title">{title}</h1>
            <p>{description}</p>
        </div>
        <svg className="destekol-inner-page-banner-wave" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
            <path fill="#80d0d3" opacity=".72" d="M0 35C160 94 290 5 480 36s296 70 470 16 330-14 490 12v46H0Z"/>
            <path fill="#d8f1f2" d="M0 76C190 18 300 107 493 65s277 25 451 5 320-67 496-24v64H0Z"/>
            <path fill="white" d="M0 89C176 38 326 95 490 79s302-27 466 3 321-41 484-18v46H0Z"/>
        </svg>
    </header>;
}
