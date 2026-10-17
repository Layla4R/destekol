import { LOCALES, type Locale } from './locales';

export function donorLocale(value: unknown): Locale {
    return typeof value === 'string' && LOCALES.includes(value as Locale) ? value as Locale : 'tr';
}

export function donorPageUrl(siteUrl: string, locale: Locale, page: string, token: string): string {
    const path = locale === 'tr' ? '' : `/${locale}`;
    return `${siteUrl}${path}/${page}?token=${encodeURIComponent(token)}`;
}

export const DONOR_EMAIL_COPY: Record<Locale, {
    verifySubject: string; verifyTitle: string; verifyGreeting: string; verifyBody: string; verifyButton: string; verifyExpiry: string; verifyIgnore: string;
    resetSubject: string; resetTitle: string; resetGreeting: string; resetBody: string; resetButton: string; resetExpiry: string;
}> = {
    ar: {
        verifySubject: 'تأكيد بريدك الإلكتروني — Destekol', verifyTitle: 'تأكيد بريدك الإلكتروني', verifyGreeting: 'مرحباً',
        verifyBody: 'اضغط الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك.', verifyButton: 'تأكيد البريد الإلكتروني',
        verifyExpiry: 'ينتهي الرابط خلال 24 ساعة.', verifyIgnore: 'إذا لم تطلب إنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة.',
        resetSubject: 'إعادة تعيين كلمة المرور — Destekol', resetTitle: 'إعادة تعيين كلمة المرور', resetGreeting: 'مرحباً',
        resetBody: 'اضغط الزر أدناه لإعادة تعيين كلمة مرورك.', resetButton: 'إعادة تعيين كلمة المرور', resetExpiry: 'ينتهي الرابط خلال ساعة واحدة.',
    },
    en: {
        verifySubject: 'Verify your email — Destekol', verifyTitle: 'Verify your email address', verifyGreeting: 'Hello',
        verifyBody: 'Click the button below to verify your email address and activate your account.', verifyButton: 'Verify email address',
        verifyExpiry: 'This link expires in 24 hours.', verifyIgnore: 'If you did not create this account, you can ignore this email.',
        resetSubject: 'Reset your password — Destekol', resetTitle: 'Reset your password', resetGreeting: 'Hello',
        resetBody: 'Click the button below to reset your password.', resetButton: 'Reset password', resetExpiry: 'This link expires in one hour.',
    },
    fr: {
        verifySubject: 'Confirmez votre adresse e-mail — Destekol', verifyTitle: 'Confirmez votre adresse e-mail', verifyGreeting: 'Bonjour',
        verifyBody: 'Cliquez sur le bouton ci-dessous pour confirmer votre adresse e-mail et activer votre compte.', verifyButton: 'Confirmer mon adresse e-mail',
        verifyExpiry: 'Ce lien expire dans 24 heures.', verifyIgnore: 'Si vous n’avez pas créé ce compte, vous pouvez ignorer cet e-mail.',
        resetSubject: 'Réinitialisez votre mot de passe — Destekol', resetTitle: 'Réinitialisez votre mot de passe', resetGreeting: 'Bonjour',
        resetBody: 'Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe.', resetButton: 'Réinitialiser le mot de passe', resetExpiry: 'Ce lien expire dans une heure.',
    },
    tr: {
        verifySubject: 'E-posta adresinizi doğrulayın — Destekol', verifyTitle: 'E-posta adresinizi doğrulayın', verifyGreeting: 'Merhaba',
        verifyBody: 'E-posta adresinizi doğrulayıp hesabınızı etkinleştirmek için aşağıdaki düğmeye tıklayın.', verifyButton: 'E-postamı doğrula',
        verifyExpiry: 'Bu bağlantı 24 saat içinde geçerliliğini yitirir.', verifyIgnore: 'Bu hesabı siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.',
        resetSubject: 'Şifrenizi sıfırlayın — Destekol', resetTitle: 'Şifrenizi sıfırlayın', resetGreeting: 'Merhaba',
        resetBody: 'Şifrenizi sıfırlamak için aşağıdaki düğmeye tıklayın.', resetButton: 'Şifremi sıfırla', resetExpiry: 'Bu bağlantı bir saat içinde geçerliliğini yitirir.',
    },
};

export const DONOR_AUTH_ERROR_COPY: Record<Locale, {
    required: string; passwordShort: string; emailExists: string; invalidCredentials: string; unverified: string; adminLogin: string; registerFailed: string; serverError: string;
}> = {
    ar: { required: 'جميع الحقول مطلوبة', passwordShort: 'كلمة المرور 8 أحرف على الأقل', emailExists: 'هذا البريد الإلكتروني مسجل مسبقاً', invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', unverified: 'يرجى تفعيل حسابك من خلال الرابط المرسل إلى بريدك الإلكتروني أولاً', adminLogin: 'استخدم صفحة تسجيل دخول الإدارة', registerFailed: 'حدث خطأ في التسجيل', serverError: 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً' },
    en: { required: 'All fields are required', passwordShort: 'Password must be at least 8 characters', emailExists: 'This email is already registered', invalidCredentials: 'Invalid email or password', unverified: 'Please verify your account using the link sent to your email first', adminLogin: 'Use the admin sign-in page', registerFailed: 'Could not create your account', serverError: 'A server error occurred. Please try again later.' },
    fr: { required: 'Tous les champs sont obligatoires', passwordShort: 'Le mot de passe doit contenir au moins 8 caractères', emailExists: 'Cette adresse e-mail est déjà enregistrée', invalidCredentials: 'Adresse e-mail ou mot de passe invalide', unverified: 'Veuillez d’abord confirmer votre compte avec le lien envoyé par e-mail', adminLogin: 'Utilisez la page de connexion administrateur', registerFailed: 'Impossible de créer votre compte', serverError: 'Une erreur du serveur s’est produite. Veuillez réessayer plus tard.' },
    tr: { required: 'Tüm alanlar zorunludur', passwordShort: 'Şifre en az 8 karakter olmalıdır', emailExists: 'Bu e-posta zaten kayıtlı', invalidCredentials: 'Geçersiz e-posta veya şifre', unverified: 'Önce e-postanıza gönderilen bağlantıyla hesabınızı doğrulayın', adminLogin: 'Yönetici giriş sayfasını kullanın', registerFailed: 'Hesabınız oluşturulamadı', serverError: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.' },
};
