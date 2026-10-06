export type PolicySection = {
    title: string;
    text: string;
};
export const policies: Record<string, Record<string, PolicySection[]>> = {
    "ar": {
        "privacy": [
            {
                "title": "سياسة الخصوصية وحماية البيانات (متوافقة مع GDPR)",
                "text": "ترحب بكم Destekol Humanitarian Foundation، ونلتزم بحماية خصوصيتكم والحفاظ على سرية بياناتكم الشخصية. توضح هذه السياسة كيفية جمع بياناتكم واستخدامها وتخزينها وحمايتها عند استخدام موقعنا الإلكتروني أو خدماتنا الرقمية أو التبرع عبر منصتنا."
            },
            {
                "title": "البيانات التي نجمعها",
                "text": "• الاسم الكامل\n• عنوان البريد الإلكتروني\n• رقم الهاتف\n• عنوان الإقامة أو الدولة\n• بيانات التبرعات والمعاملات المالية\n• معلومات الحساب عند التسجيل\n• بيانات التواصل والاستفسارات\n• المعلومات التقنية: عنوان IP ونوع المتصفح وملفات تعريف الارتباط"
            },
            {
                "title": "كيفية استخدام البيانات",
                "text": "• معالجة التبرعات والمدفوعات\n• إنشاء وإدارة حسابات المستخدمين\n• التواصل مع المتبرعين والمستفيدين والشركاء\n• إرسال الإيصالات والتقارير والتحديثات\n• تحسين خدمات الموقع وتجربة المستخدم\n• الامتثال للمتطلبات القانونية والتنظيمية\n• منع الاحتيال وتعزيز أمن المنصة"
            },
            {
                "title": "حماية البيانات",
                "text": "نطبق تدابير تقنية وإدارية متقدمة تشمل تشفير البيانات أثناء النقل والتخزين، واستخدام خوادم آمنة، وضوابط صارمة للتحكم في الوصول، ومراقبة أمنية مستمرة. لا نقوم ببيع أو تأجير أو المتاجرة ببياناتكم الشخصية."
            },
            {
                "title": "حقوقكم وفقاً للائحة GDPR",
                "text": "• الوصول إلى بياناتكم الشخصية\n• تصحيح البيانات غير الدقيقة\n• طلب حذف البيانات عندما يسمح القانون بذلك\n• تقييد معالجة البيانات\n• الاعتراض على بعض أنواع المعالجة\n• سحب الموافقة في أي وقت\n• طلب نقل البيانات إلى مزود آخر\n• تقديم شكوى إلى الجهة الرقابية المختصة"
            }
        ],
        "terms": [
            {
                "title": "الإطار القانوني",
                "text": "• تلتزم المنصة بتشريعات حماية المستهلك والتجارة الإلكترونية\n• متطلبات مكافحة غسل الأموال وتمويل الإرهاب\n• حماية البيانات الشخصية وفق المعايير الدولية\n• أفضل ممارسات الحوكمة للمؤسسات غير الربحية"
            },
            {
                "title": "أهلية الاستخدام",
                "text": "• تكون مؤهلاً قانونياً لإبرام العقود وفق قوانين بلدك\n• تقدم معلومات صحيحة ودقيقة ومحدثة\n• تستخدم وسائل دفع قانونية ومصرحاً لك باستخدامها\n• تمتثل لجميع القوانين واللوائح المعمول بها"
            },
            {
                "title": "التبرعات",
                "text": "• التبرع يتم بإرادتك الحرة والأموال مصدرها مشروع\n• قد تعيد المؤسسة توجيه التبرعات إلى مشروع مماثل إذا اكتمل تمويل المشروع المختار\n• لا يُعد التبرع عملية شراء أو استثماراً يضمن نتائج محددة"
            },
            {
                "title": "التزامات المؤسسة",
                "text": "• إدارة التبرعات بمسؤولية ونزاهة\n• إصدار إيصالات إلكترونية فورية\n• نشر تقارير مالية وتقارير أثر دورية\n• حماية البيانات الشخصية وفق سياسة الخصوصية\n• تطبيق أعلى معايير الشفافية والمساءلة والحوكمة"
            },
            {
                "title": "دقة المعلومات والاستخدام المقبول",
                "text": "إذا لاحظت خطأ أو معلومة تحتاج إلى تحديث، أرسل رابط الصفحة إلى البريد الرسمي. إجابات المساعد الآلي قد تخطئ ولا تُعد تأكيداً رسمياً من المؤسسة. لا تستخدم الموقع للإساءة أو انتحال الهوية أو إرسال معلومات مالية حساسة."
            }
        ],
        "refund-policy": [
            {
                "title": "حالة الاسترداد حالياً",
                "text": "لم تُفتح قنوات استقبال التبرعات بعد؛ لذلك لا نعرض حالياً إجراءً تنفيذياً أو مدة مضمونة لاسترداد تبرعات عبر الموقع. سنوضح شروط الدفع والاسترداد قبل فتح القنوات."
            },
            {
                "title": "إذا أرسلت مبلغاً أو تلقيت طلب دفع",
                "text": "راسل info@destekol.org مع تاريخ الواقعة والجهة أو الرابط المستخدم ووصف مختصر. لا ترسل بيانات البطاقة أو رموز التحقق. نراجع ما يمكن التحقق منه؛ لا يمكننا ضمان استرداد مبلغ أُرسل إلى جهة أخرى أو تأكيد صلة أي طلب دفع بالمؤسسة قبل فحصه."
            }
        ],
        "cookie-policy": [
            {
                "title": "كيف نستخدمها؟",
                "text": "• تشغيل الوظائف الأساسية للموقع وضمان عمله بشكل صحيح\n• حفظ تفضيلات المستخدم وإعداداته لتحسين تجربة التصفح\n• تحليل أداء الموقع وقياس عدد الزيارات وسلوك المستخدمين\n• تعزيز أمن الموقع والكشف عن الأنشطة غير المشروعة\n• تحسين المحتوى والخدمات بما يتناسب مع احتياجات الزوار"
            },
            {
                "title": "إدارة ملفات تعريف الارتباط",
                "text": "يمكنك قبول أو رفض أو حذف ملفات تعريف الارتباط في أي وقت من خلال إعدادات متصفحك. تعطيل بعضها قد يؤثر في أداء بعض وظائف الموقع."
            },
            {
                "title": "التخزين في المتصفح",
                "text": "يستخدم الموقع ملفات جلسة لتسجيل الدخول، وتخزيناً محلياً لبعض التفضيلات مثل اختيار ملفات الارتباط وسلة الموقع. يمكن حذف هذه البيانات من إعدادات المتصفح، وقد يؤدي ذلك إلى تسجيل الخروج أو فقدان التفضيلات."
            }
        ],
        "aml-policy": [
            {
                "title": "خبرة مؤسسية والتزام مسؤول",
                "text": "مؤسستنا مستقلة حالياً، ونستند في عملنا إلى خبرة مؤسسية ممتدة. ونلتزم بحماية الثقة التي يضعها فينا الداعمون والشركاء، وتطبيق إجراءات تتناسب مع طبيعة أنشطتنا والمتطلبات القانونية ذات الصلة. قنوات التبرع عبر الموقع لم تُفتح بعد؛ وتعبّر الالتزامات أدناه عن نهجنا المؤسسي في التعامل مع الأموال والشراكات."
            },
            {
                "title": "التزاماتنا",
                "text": "• تطبيق إجراءات فعالة لمكافحة غسل الأموال وتمويل الإرهاب والاحتيال.\n• حماية أموال المتبرعين وضمان استخدامها في الأغراض الإنسانية المخصصة لها.\n• التحقق من هوية الشركاء والجهات المتعاملة عند الاقتضاء.\n• مراقبة المعاملات المالية للكشف عن أي نشاط غير اعتيادي أو مشبوه.\n• التعاون مع الجهات الرقابية والتنظيمية المختصة وفقاً للمتطلبات القانونية."
            },
            {
                "title": "الإطار المرجعي",
                "text": "• توصيات مجموعة العمل المالي (FATF).\n• متطلبات مكافحة غسل الأموال وتمويل الإرهاب (AML/CFT).\n• أنظمة العقوبات الدولية حيثما تنطبق.\n• التشريعات الوطنية ذات الصلة في الدول التي تعمل فيها المؤسسة."
            },
            {
                "title": "مسؤوليات المستخدم",
                "text": "• أن تكون الأموال المستخدمة في التبرعات من مصدر مشروع.\n• تقديم معلومات صحيحة وكاملة.\n• عدم استخدام المنصة لأي نشاط غير قانوني أو احتيالي.\n• الالتزام بالقوانين والأنظمة السارية في دولة الإقامة."
            },
            {
                "title": "الإبلاغ عن طلب مشبوه",
                "text": "إذا وصلتك رسالة تطلب تحويلاً باسم المؤسسة، أرسل رابطها أو وصفها إلى البريد الرسمي للتحقق. لا تشارك كلمات المرور أو رموز التحقق، ولا تعتبر وجود الشعار دليلاً كافياً على صحة الطلب."
            }
        ],
        "complaints": [
            {
                "title": "بريد واحد لجميع الطلبات",
                "text": "الاستفسارات والشكاوى وطلبات الخصوصية والتواصل الإعلامي والشراكات تُستقبل حالياً عبر info@destekol.org. لا توجد عناوين بريد منفصلة معلنة لهذه الأقسام. اكتب نوع الطلب في عنوان الرسالة ليسهل توجيهه."
            },
            {
                "title": "كيف تقدم ملاحظة أو شكوى؟",
                "text": "اذكر رابط الصفحة أو تاريخ الواقعة ووصف المشكلة وطريقة التواصل المناسبة. أرسل فقط المعلومات الضرورية. سنطلب توضيحات إذا احتاجت المراجعة إليها؛ نرد خلال 24 ساعة، ونوضح الخطوة التالية وما إذا كانت المعالجة تحتاج إلى وقت إضافي. إذا كان طلبك يتعلق بتحويل مالي، أرفق تاريخه والجهة المستلمة دون بيانات مصرفية حساسة."
            }
        ],
        "financial-transparency": [
            {
                "title": "المعلومات المتاحة",
                "text": "لم تُفتح قنوات التبرع عبر الموقع بعد. لا ينبغي اعتبار العدادات أو أهداف الحملات أو الصور المنشورة قوائم مالية أو دليلاً على مبالغ جُمعت من خلال المنصة."
            },
            {
                "title": "التقارير والاستفسارات",
                "text": "نبني معلوماتنا المالية على مستندات يمكن الرجوع إليها. عند نشر تقرير، ينبغي أن يوضح الفترة التي يغطيها ومصدره، وما إذا خضع لتدقيق مستقل. يمكنك طلب معلومات عن مشروع أو تقرير محدد عبر البريد الرسمي. ننشر نسب المصروفات وتخصيص الأموال عندما تتوفر بيانات تدعمها."
            }
        ],
        "how-we-use-donations": [
            {
                "title": "قبل فتح قنوات التبرع",
                "text": "لم يبدأ استقبال التبرعات عبر قنوات الموقع. وصف المشاريع يوضح مجال العمل أو الاحتياج، ولا يُعد وعداً بتخصيص نسبة ثابتة من تبرع لم يُستقبل بعد."
            },
            {
                "title": "المعلومات المطلوبة عند الإطلاق",
                "text": "عند فتح قنوات التبرع، ستوضح المعلومات المنشورة الغرض من الحملة وأي تكاليف أو قيود أو شروط ذات صلة. لا نَعِد حالياً بأن كامل كل تبرع يصل إلى المستفيدين، أو بموعد تنفيذ محدد، دون بيانات موثقة."
            }
        ],
        "license": [
            {
                "title": "المحتوى والعلامات",
                "text": "قد تتضمن صفحات الموقع نصوصاً وصوراً وعلامات تخص المؤسسة أو أصحاب حقوق آخرين. للاستفسار عن إعادة استخدام محتوى محدد أو الإبلاغ عن مشكلة في نسبته، أرسل رابطه إلى البريد الرسمي."
            },
            {
                "title": "الوثائق والمعلومات الرسمية",
                "text": "وجود الموقع أو اسم المؤسسة أو رابط سجل عام لا يثبت بمفرده ترخيصاً لجمع التبرعات أو إعفاءً ضريبياً أو اعتماداً أمنياً. قنوات التبرع لم تُفتح بعد، ويمكن طلب معلومات محددة عن الوثائق المتاحة عبر البريد الرسمي."
            }
        ]
    },
    "en": {
        "privacy": [
            {
                "title": "Privacy and data protection policy (GDPR compliant)",
                "text": "Destekol Humanitarian Foundation welcomes you. We are committed to protecting your privacy and maintaining the confidentiality of your personal data. This policy explains how we collect, use, store and protect your data when you use our website or digital services or donate through our platform."
            },
            {
                "title": "Data we collect",
                "text": "• Full name\n• Email address\n• Phone number\n• Residential address or country\n• Donation and financial transaction data\n• Account information on registration\n• Communications and enquiries\n• Technical information: IP address, browser type and cookies"
            },
            {
                "title": "How we use data",
                "text": "• Process donations and payments\n• Create and manage user accounts\n• Communicate with donors, beneficiaries and partners\n• Send receipts, reports and updates\n• Improve website services and user experience\n• Comply with legal and regulatory requirements\n• Prevent fraud and strengthen platform security"
            },
            {
                "title": "Data protection",
                "text": "We apply advanced technical and administrative measures, including encryption in transit and at rest, secure servers, strict access controls and continuous security monitoring. We do not sell, rent or trade your personal data."
            },
            {
                "title": "Your rights under the GDPR",
                "text": "• Access your personal data\n• Correct inaccurate data\n• Request deletion where permitted by law\n• Restrict data processing\n• Object to certain types of processing\n• Withdraw consent at any time\n• Request transfer of data to another provider\n• Lodge a complaint with the competent supervisory authority"
            }
        ],
        "terms": [
            {
                "title": "Legal framework",
                "text": "• The platform complies with consumer protection and e-commerce legislation\n• Anti-money laundering and counter-terrorist financing requirements\n• Personal data protection in accordance with international standards\n• Best governance practices for nonprofit organisations"
            },
            {
                "title": "Eligibility to use the platform",
                "text": "• You must have legal capacity to enter into contracts under the laws of your country\n• Provide truthful, accurate and up-to-date information\n• Use lawful payment methods that you are authorised to use\n• Comply with all applicable laws and regulations"
            },
            {
                "title": "Donations",
                "text": "• Donations are voluntary and funds must come from lawful sources\n• The organisation may redirect donations to a similar project if the selected project is fully funded\n• A donation is not a purchase or an investment guaranteeing specific results"
            },
            {
                "title": "The organisation’s commitments",
                "text": "• Manage donations responsibly and with integrity\n• Issue immediate electronic receipts\n• Publish periodic financial and impact reports\n• Protect personal data in accordance with the privacy policy\n• Apply the highest standards of transparency, accountability and governance"
            },
            {
                "title": "Accuracy and acceptable use",
                "text": "If you notice an error or information that needs updating, send the page link to the official email. Automated assistant answers may be incorrect and are not official confirmation from the organisation. Do not use the website for abuse, impersonation or sending sensitive financial information."
            }
        ],
        "refund-policy": [
            {
                "title": "Current refund status",
                "text": "Donation channels are not open, so we do not currently offer an operational refund process or guaranteed refund times for website donations. Payment and refund terms will be explained before channels open."
            },
            {
                "title": "If you sent money or received a payment request",
                "text": "Email info@destekol.org with the date, recipient or link used and a brief description. Do not send card details or verification codes. We can review available information but cannot guarantee recovery of money sent to another party or confirm a request's connection to the organisation without checking it."
            }
        ],
        "cookie-policy": [
            {
                "title": "How do we use them?",
                "text": "• Operate essential website features and ensure the site works correctly\n• Save user preferences and settings to improve browsing\n• Analyse website performance, visitor numbers and user behaviour\n• Strengthen website security and detect unlawful activity\n• Improve content and services to meet visitors’ needs"
            },
            {
                "title": "Managing cookies",
                "text": "You can accept, reject or delete cookies at any time through your browser settings. Disabling some cookies may affect how certain website features work."
            },
            {
                "title": "Browser storage",
                "text": "The website uses session cookies for login and local storage for preferences such as cookie choices and the website basket. You can delete this data through your browser settings, which may sign you out or remove your preferences."
            }
        ],
        "aml-policy": [
            {
                "title": "Institutional experience and responsible practice",
                "text": "Our organisation is currently independent and draws on longstanding institutional experience. We are committed to the trust of our supporters and partners through procedures appropriate to our activities and applicable legal requirements. Website donation channels are not yet open; the commitments below describe our institutional approach to funds and partnerships."
            },
            {
                "title": "Our commitments",
                "text": "• Apply effective measures against money laundering, terrorist financing and fraud.\n• Protect donor funds and ensure they are used for their designated humanitarian purposes.\n• Verify the identity of partners and counterparties where appropriate.\n• Monitor financial transactions for unusual or suspicious activity.\n• Cooperate with competent regulatory and supervisory authorities as legally required."
            },
            {
                "title": "Reference framework",
                "text": "• Financial Action Task Force (FATF) recommendations.\n• Anti-money laundering and counter-terrorist financing (AML/CFT) requirements.\n• International sanctions regimes where applicable.\n• Relevant national legislation in the countries where the organisation operates."
            },
            {
                "title": "User responsibilities",
                "text": "• Donation funds must come from lawful sources.\n• Provide accurate and complete information.\n• Do not use the platform for unlawful or fraudulent activity.\n• Comply with applicable laws and regulations in your country of residence."
            },
            {
                "title": "Report a suspicious request",
                "text": "If you receive a transfer request in the organisation's name, send its link or a description to the official email for verification. Do not share passwords or verification codes; a logo alone does not establish that a request is genuine."
            }
        ],
        "complaints": [
            {
                "title": "One inbox for all enquiries",
                "text": "General enquiries, complaints, privacy requests, media and partnership enquiries currently use info@destekol.org. We do not advertise separate departmental inboxes. State your topic in the subject line so the message can be directed appropriately."
            },
            {
                "title": "How to raise an issue",
                "text": "Include the page link or incident date, a description and a suitable contact method. Share only necessary information. Further details may be requested, and we reply within 24 hours, explaining the next step and whether more time is needed. For a payment-related enquiry, note that donation channels have not opened."
            }
        ],
        "financial-transparency": [
            {
                "title": "Available information",
                "text": "Website donation channels have not opened. Counters, campaign targets and published images should not be treated as financial statements or evidence of money raised through this platform."
            },
            {
                "title": "Reports and enquiries",
                "text": "This page does not claim independent financial audits or published reports unless the document, period and source are provided. To ask about a particular report or project, name it in an email. We do not state expense or allocation percentages without supporting records."
            }
        ],
        "how-we-use-donations": [
            {
                "title": "Before donation channels open",
                "text": "Donations are not yet being accepted through website channels. Project descriptions explain activities or needs; they are not a promise to allocate a fixed share of a donation that has not been received."
            },
            {
                "title": "Information at launch",
                "text": "When channels open, published information will explain campaign purposes and relevant costs, restrictions and conditions. We do not currently promise that every donation reaches beneficiaries in full or guarantee delivery dates without documented information."
            }
        ],
        "license": [
            {
                "title": "Content and brands",
                "text": "Website text, images and brands may belong to the organisation or other rights holders. Email the specific page link to ask about reuse or report an attribution issue."
            },
            {
                "title": "Limits of this page",
                "text": "The website, organisation name or a public-register link does not by itself establish fundraising authorisation, tax exemption or security accreditation. Donation channels are not open. You can request specific information about available documents by email."
            }
        ]
    },
    "fr": {
        "privacy": [
            {
                "title": "Politique de confidentialité et de protection des données (conforme au RGPD)",
                "text": "Destekol Humanitarian Foundation vous souhaite la bienvenue. Nous nous engageons à protéger votre vie privée et à préserver la confidentialité de vos données personnelles. Cette politique explique comment nous collectons, utilisons, conservons et protégeons vos données lorsque vous utilisez notre site, nos services numériques ou effectuez un don sur notre plateforme."
            },
            {
                "title": "Données que nous collectons",
                "text": "• Nom complet\n• Adresse électronique\n• Numéro de téléphone\n• Adresse de résidence ou pays\n• Données relatives aux dons et aux transactions financières\n• Informations du compte lors de l’inscription\n• Communications et demandes de renseignements\n• Informations techniques : adresse IP, type de navigateur et cookies"
            },
            {
                "title": "Utilisation des données",
                "text": "• Traiter les dons et les paiements\n• Créer et gérer les comptes utilisateurs\n• Communiquer avec les donateurs, bénéficiaires et partenaires\n• Envoyer les reçus, rapports et mises à jour\n• Améliorer les services du site et l’expérience utilisateur\n• Respecter les exigences légales et réglementaires\n• Prévenir la fraude et renforcer la sécurité de la plateforme"
            },
            {
                "title": "Protection des données",
                "text": "Nous appliquons des mesures techniques et administratives avancées, notamment le chiffrement des données en transit et au repos, des serveurs sécurisés, des contrôles d’accès stricts et une surveillance continue de la sécurité. Nous ne vendons, ne louons ni ne commercialisons vos données personnelles."
            },
            {
                "title": "Vos droits au titre du RGPD",
                "text": "• Accéder à vos données personnelles\n• Rectifier les données inexactes\n• Demander la suppression des données lorsque la loi le permet\n• Limiter le traitement des données\n• Vous opposer à certains types de traitement\n• Retirer votre consentement à tout moment\n• Demander le transfert des données à un autre prestataire\n• Déposer une réclamation auprès de l’autorité de contrôle compétente"
            }
        ],
        "terms": [
            {
                "title": "Cadre juridique",
                "text": "• La plateforme respecte la législation relative à la protection des consommateurs et au commerce électronique\n• Les exigences de lutte contre le blanchiment et le financement du terrorisme\n• La protection des données personnelles selon les normes internationales\n• Les meilleures pratiques de gouvernance des organismes à but non lucratif"
            },
            {
                "title": "Conditions d’utilisation",
                "text": "• Avoir la capacité juridique de conclure des contrats selon les lois de votre pays\n• Fournir des informations véridiques, exactes et à jour\n• Utiliser des moyens de paiement légaux que vous êtes autorisé à utiliser\n• Respecter toutes les lois et réglementations applicables"
            },
            {
                "title": "Dons",
                "text": "• Les dons sont volontaires et les fonds doivent avoir une origine licite\n• L’organisme peut réaffecter les dons à un projet similaire si le projet choisi est entièrement financé\n• Un don ne constitue ni un achat ni un investissement garantissant des résultats précis"
            },
            {
                "title": "Engagements de l’organisme",
                "text": "• Gérer les dons avec responsabilité et intégrité\n• Émettre immédiatement des reçus électroniques\n• Publier périodiquement des rapports financiers et d’impact\n• Protéger les données personnelles conformément à la politique de confidentialité\n• Appliquer les normes les plus élevées de transparence, de responsabilité et de gouvernance"
            },
            {
                "title": "Exactitude des informations et usage acceptable",
                "text": "Si vous constatez une erreur ou une information à mettre à jour, envoyez le lien de la page à l’adresse officielle. Les réponses de l’assistant automatisé peuvent être incorrectes et ne constituent pas une confirmation officielle de l’organisme. N’utilisez pas le site pour des abus, une usurpation d’identité ou l’envoi d’informations financières sensibles."
            }
        ],
        "refund-policy": [
            {
                "title": "Situation actuelle",
                "text": "Les canaux de dons ne sont pas ouverts. Nous ne présentons donc pas de procédure opérationnelle ni de délai garanti de remboursement de dons en ligne. Les conditions seront précisées avant l'ouverture."
            },
            {
                "title": "Somme envoyée ou demande de paiement reçue",
                "text": "Contactez info@destekol.org en précisant la date, le destinataire ou le lien et les faits. N'envoyez pas de données de carte ou de codes de vérification. Nous pouvons examiner les informations disponibles, sans garantir la récupération de fonds envoyés à un tiers ni l'authenticité d'une demande avant vérification."
            }
        ],
        "cookie-policy": [
            {
                "title": "Comment les utilisons-nous ?",
                "text": "• Faire fonctionner les fonctionnalités essentielles et assurer le bon fonctionnement du site\n• Enregistrer les préférences et réglages pour améliorer la navigation\n• Analyser les performances, le nombre de visites et le comportement des utilisateurs\n• Renforcer la sécurité du site et détecter les activités illégales\n• Améliorer les contenus et services selon les besoins des visiteurs"
            },
            {
                "title": "Gestion des cookies",
                "text": "Vous pouvez accepter, refuser ou supprimer les cookies à tout moment dans les paramètres de votre navigateur. La désactivation de certains cookies peut affecter le fonctionnement de certaines fonctionnalités du site."
            },
            {
                "title": "Stockage dans le navigateur",
                "text": "Le site utilise des cookies de session pour la connexion et un stockage local pour certaines préférences, comme le choix des cookies et le panier. Vous pouvez supprimer ces données dans les paramètres du navigateur, ce qui peut vous déconnecter ou effacer vos préférences."
            }
        ],
        "aml-policy": [
            {
                "title": "Expérience institutionnelle et engagement responsable",
                "text": "Notre organisme est actuellement indépendant et bénéficie d’une longue expérience institutionnelle. Nous préservons la confiance de nos soutiens et partenaires par des procédures adaptées à nos activités et aux exigences légales applicables. Les canaux de dons du site ne sont pas encore ouverts ; les engagements suivants décrivent notre approche des fonds et des partenariats."
            },
            {
                "title": "Nos engagements",
                "text": "• Appliquer des mesures efficaces contre le blanchiment, le financement du terrorisme et la fraude.\n• Protéger les fonds des donateurs et garantir leur utilisation aux fins humanitaires prévues.\n• Vérifier l’identité des partenaires et des parties concernées lorsque cela est nécessaire.\n• Surveiller les transactions financières pour détecter les activités inhabituelles ou suspectes.\n• Coopérer avec les autorités compétentes conformément aux exigences légales."
            },
            {
                "title": "Cadre de référence",
                "text": "• Recommandations du Groupe d’action financière (GAFI/FATF).\n• Exigences de lutte contre le blanchiment et le financement du terrorisme (AML/CFT).\n• Régimes de sanctions internationales lorsqu’ils s’appliquent.\n• Législations nationales pertinentes dans les pays où l’organisme intervient."
            },
            {
                "title": "Responsabilités des utilisateurs",
                "text": "• Les fonds donnés doivent avoir une origine licite.\n• Fournir des informations exactes et complètes.\n• Ne pas utiliser la plateforme à des fins illégales ou frauduleuses.\n• Respecter les lois et règlements applicables dans le pays de résidence."
            },
            {
                "title": "Demande suspecte",
                "text": "Envoyez le lien ou la description d'une demande de transfert reçue au nom de l'organisme à l'adresse officielle. Ne partagez aucun mot de passe ou code de vérification. Un logo ne suffit pas à authentifier une demande."
            }
        ],
        "complaints": [
            {
                "title": "Une seule adresse",
                "text": "Les questions, réclamations, demandes de confidentialité, de presse et de partenariat passent par info@destekol.org. Aucun service ne dispose d'une autre adresse annoncée. Indiquez le sujet de votre demande dans l'objet."
            },
            {
                "title": "Décrire le problème",
                "text": "Précisez le lien ou la date, les faits et un moyen de réponse. Partagez uniquement les informations nécessaires. Des précisions peuvent être demandées ; nous répondons sous 24 heures en précisant la prochaine étape et si un délai supplémentaire est nécessaire. Pour une question de paiement, rappelez que les dons ne sont pas encore ouverts."
            }
        ],
        "financial-transparency": [
            {
                "title": "Informations disponibles",
                "text": "Les canaux de dons du site ne sont pas ouverts. Les compteurs, objectifs et images ne constituent pas des états financiers ni une preuve de collecte sur la plateforme."
            },
            {
                "title": "Rapports",
                "text": "Cette page ne revendique pas d'audit indépendant ou de rapport publié sans fournir le document, sa période et sa source. Contactez-nous au sujet d'un rapport ou projet précis. Aucun pourcentage de frais ou d'affectation n'est affirmé sans justificatif."
            }
        ],
        "how-we-use-donations": [
            {
                "title": "Avant l'ouverture",
                "text": "Les dons ne sont pas encore acceptés par les canaux du site. Les descriptions de projets exposent des activités ou besoins, sans promettre une répartition fixe de fonds non reçus."
            },
            {
                "title": "Lors du lancement",
                "text": "Les informations publiées préciseront les objectifs des campagnes et les frais, limites et conditions pertinents. Nous ne promettons actuellement ni versement intégral de chaque don aux bénéficiaires ni délai d'exécution sans données documentées."
            }
        ],
        "license": [
            {
                "title": "Contenus et marques",
                "text": "Les textes, images et marques peuvent appartenir à l'organisme ou à d'autres titulaires de droits. Envoyez le lien concerné pour une demande de réutilisation ou un problème d'attribution."
            },
            {
                "title": "Portée de cette page",
                "text": "Le site, le nom de l'organisme ou un lien vers un registre public ne prouve pas à lui seul une autorisation de collecte, une exonération fiscale ou une certification de sécurité. Les dons ne sont pas ouverts. Les documents disponibles peuvent faire l'objet d'une demande précise par e-mail."
            }
        ]
    },
    "tr": {
        "privacy": [
            {
                "title": "Gizlilik ve veri koruma politikası (GDPR ile uyumlu)",
                "text": "Destekol Humanitarian Foundation olarak hoş geldiniz diyoruz. Gizliliğinizi korumayı ve kişisel verilerinizin gizliliğini sağlamayı taahhüt ediyoruz. Bu politika, web sitemizi veya dijital hizmetlerimizi kullandığınızda ya da platformumuz üzerinden bağış yaptığınızda verilerinizi nasıl topladığımızı, kullandığımızı, sakladığımızı ve koruduğumuzu açıklar."
            },
            {
                "title": "Topladığımız veriler",
                "text": "• Ad ve soyadı\n• E-posta adresi\n• Telefon numarası\n• İkamet adresi veya ülke\n• Bağış ve mali işlem verileri\n• Kayıt sırasında hesap bilgileri\n• İletişim ve bilgi talepleri\n• Teknik bilgiler: IP adresi, tarayıcı türü ve çerezler"
            },
            {
                "title": "Verileri nasıl kullanıyoruz?",
                "text": "• Bağış ve ödemeleri işlemek\n• Kullanıcı hesaplarını oluşturmak ve yönetmek\n• Bağışçılar, yararlanıcılar ve ortaklarla iletişim kurmak\n• Makbuz, rapor ve güncellemeler göndermek\n• Site hizmetlerini ve kullanıcı deneyimini iyileştirmek\n• Yasal ve düzenleyici gerekliliklere uymak\n• Dolandırıcılığı önlemek ve platform güvenliğini güçlendirmek"
            },
            {
                "title": "Veri koruma",
                "text": "Aktarım ve depolama sırasında veri şifreleme, güvenli sunucular, sıkı erişim kontrolleri ve sürekli güvenlik izleme dahil olmak üzere gelişmiş teknik ve idari önlemler uyguluyoruz. Kişisel verilerinizi satmıyor, kiralamıyor veya ticaretini yapmıyoruz."
            },
            {
                "title": "GDPR kapsamındaki haklarınız",
                "text": "• Kişisel verilerinize erişmek\n• Yanlış verileri düzeltmek\n• Yasaların izin verdiği durumlarda verilerin silinmesini istemek\n• Veri işlemeyi kısıtlamak\n• Belirli işleme türlerine itiraz etmek\n• Onayı istediğiniz zaman geri çekmek\n• Verilerin başka bir sağlayıcıya aktarılmasını istemek\n• Yetkili denetim makamına şikâyette bulunmak"
            }
        ],
        "terms": [
            {
                "title": "Yasal çerçeve",
                "text": "• Platform, tüketicinin korunması ve elektronik ticaret mevzuatına uyar\n• Kara para aklama ve terörün finansmanıyla mücadele gereklilikleri\n• Uluslararası standartlara uygun kişisel veri koruması\n• Kâr amacı gütmeyen kuruluşlar için en iyi yönetişim uygulamaları"
            },
            {
                "title": "Kullanım uygunluğu",
                "text": "• Ülkenizin yasalarına göre sözleşme yapma ehliyetine sahip olmalısınız\n• Doğru, eksiksiz ve güncel bilgiler sunmalısınız\n• Kullanmaya yetkili olduğunuz yasal ödeme yöntemlerini kullanmalısınız\n• Geçerli tüm yasa ve düzenlemelere uymalısınız"
            },
            {
                "title": "Bağışlar",
                "text": "• Bağışlar özgür iradeyle yapılır ve fonların kaynağı yasal olmalıdır\n• Seçilen projenin finansmanı tamamlanırsa kuruluş bağışları benzer bir projeye yönlendirebilir\n• Bağış, belirli sonuçları garanti eden bir satın alma veya yatırım değildir"
            },
            {
                "title": "Kuruluşun taahhütleri",
                "text": "• Bağışları sorumluluk ve dürüstlükle yönetmek\n• Anında elektronik makbuz düzenlemek\n• Düzenli mali raporlar ve etki raporları yayımlamak\n• Kişisel verileri gizlilik politikasına uygun olarak korumak\n• En yüksek şeffaflık, hesap verebilirlik ve yönetişim standartlarını uygulamak"
            },
            {
                "title": "Bilgilerin doğruluğu ve kabul edilebilir kullanım",
                "text": "Bir hata veya güncellenmesi gereken bilgi fark ederseniz sayfa bağlantısını resmî e-posta adresine gönderin. Otomatik asistanın yanıtları hatalı olabilir ve kuruluşun resmî teyidi sayılmaz. Siteyi kötüye kullanım, kimliğe bürünme veya hassas mali bilgi göndermek için kullanmayın."
            }
        ],
        "refund-policy": [
            {
                "title": "Mevcut iade durumu",
                "text": "Bağış kanalları açılmadığından çevrimiçi bağışlar için şu anda işleyen bir iade süreci veya garantili süre sunmuyoruz. Ödeme ve iade koşulları açılıştan önce açıklanacaktır."
            },
            {
                "title": "Para gönderdiyseniz veya ödeme talebi aldıysanız",
                "text": "Tarihi, alıcıyı veya bağlantıyı ve kısa açıklamayı info@destekol.org adresine gönderin. Kart bilgisi veya doğrulama kodu göndermeyin. Mevcut bilgiler incelenebilir; üçüncü tarafa gönderilen paranın geri alınması veya talebin kuruluşa ait olduğu inceleme öncesinde garanti edilemez."
            }
        ],
        "cookie-policy": [
            {
                "title": "Nasıl kullanıyoruz?",
                "text": "• Sitenin temel işlevlerini çalıştırmak ve düzgün çalışmasını sağlamak\n• Gezinme deneyimini iyileştirmek için kullanıcı tercihlerini ve ayarlarını kaydetmek\n• Site performansını, ziyaret sayılarını ve kullanıcı davranışlarını analiz etmek\n• Site güvenliğini güçlendirmek ve yasa dışı faaliyetleri tespit etmek\n• İçerik ve hizmetleri ziyaretçilerin ihtiyaçlarına göre iyileştirmek"
            },
            {
                "title": "Çerez yönetimi",
                "text": "Tarayıcı ayarlarınızdan çerezleri istediğiniz zaman kabul edebilir, reddedebilir veya silebilirsiniz. Bazı çerezleri devre dışı bırakmak, sitenin bazı işlevlerinin çalışmasını etkileyebilir."
            },
            {
                "title": "Tarayıcıda depolama",
                "text": "Site, giriş için oturum çerezleri; çerez seçimi ve site sepeti gibi bazı tercihler için yerel depolama kullanır. Bu verileri tarayıcı ayarlarından silebilirsiniz; bu işlem oturumunuzu kapatabilir veya tercihlerinizi kaldırabilir."
            }
        ],
        "aml-policy": [
            {
                "title": "Kurumsal deneyim ve sorumlu yaklaşım",
                "text": "Kuruluşumuz şu anda bağımsızdır ve uzun yıllara dayanan kurumsal deneyimden yararlanır. Destekçilerimizin ve ortaklarımızın güvenini, faaliyetlerimize ve geçerli yasal gerekliliklere uygun süreçlerle korumayı taahhüt ediyoruz. Sitenin bağış kanalları henüz açık değildir; aşağıdaki taahhütler fonlara ve ortaklıklara kurumsal yaklaşımımızı açıklar."
            },
            {
                "title": "Taahhütlerimiz",
                "text": "• Kara para aklama, terörün finansmanı ve dolandırıcılığa karşı etkili önlemler uygulamak.\n• Bağışçı fonlarını korumak ve belirlenen insani amaçlarla kullanılmasını sağlamak.\n• Gerektiğinde ortakların ve işlem yapılan tarafların kimliklerini doğrulamak.\n• Olağandışı veya şüpheli faaliyetleri tespit etmek için mali işlemleri izlemek.\n• Yasal gereklilikler doğrultusunda yetkili düzenleyici ve denetleyici makamlarla iş birliği yapmak."
            },
            {
                "title": "Referans çerçevesi",
                "text": "• Mali Eylem Görev Gücü (FATF) tavsiyeleri.\n• Kara para aklama ve terörün finansmanıyla mücadele (AML/CFT) gereklilikleri.\n• Uygulanabildiği durumlarda uluslararası yaptırım rejimleri.\n• Kuruluşun faaliyet gösterdiği ülkelerdeki ilgili ulusal mevzuat."
            },
            {
                "title": "Kullanıcı sorumlulukları",
                "text": "• Bağışta kullanılan fonların kaynağı yasal olmalıdır.\n• Doğru ve eksiksiz bilgi sunulmalıdır.\n• Platform yasa dışı veya hileli faaliyetler için kullanılmamalıdır.\n• İkamet edilen ülkede geçerli yasa ve düzenlemelere uyulmalıdır."
            },
            {
                "title": "Şüpheli talep bildirimi",
                "text": "Kuruluş adına gelen transfer talebinin bağlantısını veya açıklamasını resmî adrese gönderin. Parola ve doğrulama kodlarını paylaşmayın. Logo bulunması tek başına talebin gerçek olduğunu göstermez."
            }
        ],
        "complaints": [
            {
                "title": "Tüm talepler için tek adres",
                "text": "Sorular, şikâyetler, gizlilik, basın ve ortaklık talepleri info@destekol.org adresinden alınır. Ayrı bölüm adresleri ilan etmiyoruz. Yönlendirme için konu satırında talebinizi belirtin."
            },
            {
                "title": "Sorunun iletilmesi",
                "text": "Sayfa bağlantısını veya olay tarihini, açıklamayı ve uygun iletişim yöntemini ekleyin. Yalnızca gerekli bilgileri paylaşın. Ek açıklama istenebilir; 24 saat içinde yanıt vererek sonraki adımı ve ek süre gerekip gerekmediğini açıklıyoruz. Ödemeyle ilgili sorularda bağış kanallarının henüz açılmadığını dikkate alın."
            }
        ],
        "financial-transparency": [
            {
                "title": "Mevcut bilgiler",
                "text": "Sitenin bağış kanalları açılmadı. Sayaçlar, kampanya hedefleri ve görseller mali tablo veya platform üzerinden para toplandığının kanıtı değildir."
            },
            {
                "title": "Raporlar",
                "text": "Belge, dönem ve kaynak sunulmadıkça bu sayfa bağımsız mali denetim veya yayımlanmış rapor iddiasında bulunmaz. Belirli bir rapor veya proje için e-postayla bilgi isteyin. Destekleyici kayıt olmadan gider veya tahsis yüzdesi açıklamıyoruz."
            }
        ],
        "how-we-use-donations": [
            {
                "title": "Kanallar açılmadan önce",
                "text": "Site kanallarından henüz bağış kabul edilmiyor. Proje açıklamaları faaliyet veya ihtiyacı anlatır; henüz alınmamış bağışların sabit oranlarda dağıtılacağı vaadi değildir."
            },
            {
                "title": "Açılışta paylaşılacak bilgiler",
                "text": "Kanallar açıldığında kampanya amacı ve ilgili maliyet, kısıtlama ve koşullar açıklanacaktır. Belgelendirilmiş bilgi olmadan her bağışın tamamının yararlanıcılara ulaşacağını veya belirli uygulama tarihlerini vaat etmiyoruz."
            }
        ],
        "license": [
            {
                "title": "İçerikler ve markalar",
                "text": "Metin, görsel ve markalar kuruluşa veya başka hak sahiplerine ait olabilir. Yeniden kullanım ya da atıf sorunu için ilgili bağlantıyı resmî adrese gönderin."
            },
            {
                "title": "Bu sayfanın sınırları",
                "text": "Site, kuruluş adı veya resmî sicil bağlantısı tek başına bağış toplama izni, vergi muafiyeti veya güvenlik sertifikası kanıtı değildir. Bağış kanalları açılmadı. Mevcut belgeler hakkında belirli bilgileri e-postayla isteyebilirsiniz."
            }
        ]
    }
};
