export const CONTACT_STATUSES = ['RECEIVED','IN_PROGRESS','ANSWERED','CLOSED'] as const;
export const contactStatusLabels: Record<string, Record<string,string>> = {
 ar: {RECEIVED:'تم الاستلام',IN_PROGRESS:'قيد المعالجة',ANSWERED:'تمت الإجابة',CLOSED:'مغلق'},
 en: {RECEIVED:'Received',IN_PROGRESS:'In progress',ANSWERED:'Answered',CLOSED:'Closed'},
 fr: {RECEIVED:'Reçu',IN_PROGRESS:'En cours de traitement',ANSWERED:'Réponse apportée',CLOSED:'Clôturé'},
 tr: {RECEIVED:'Alındı',IN_PROGRESS:'İşlemde',ANSWERED:'Yanıtlandı',CLOSED:'Kapatıldı'},
};
