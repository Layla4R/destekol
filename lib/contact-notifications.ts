import { getSupabase } from './supabase';
import { sendContactNotification } from './mailer';
import { officialEmail } from './public-contact';

// A database lease prevents concurrent requests/workers from sending the same notice.
export async function notifyContact(id: string, force = false): Promise<'SENT'|'FAILED'|'PENDING'> {
    const db = getSupabase();
    const { data, error } = await db.rpc('claim_contact_notification', { p_id: id, p_force: force });
    if (error) throw new Error('Notification claim unavailable');
    const row = data?.[0];
    if (!row) return 'PENDING';
    let sent = false;
    try {
        sent = await sendContactNotification({ adminEmail: officialEmail(true), senderName: 'Website notification',
            senderEmail: officialEmail(true), subject: 'New message in the admin dashboard',
            message: `A new message is available to authorized staff in the admin dashboard. Reference: ${row.reference}` });
    } catch { /* Persist failure; never log complaint contents or SMTP credentials. */ }
    const now = new Date().toISOString();
    const { error: saveError } = await db.from('ContactMessage').update({
        notificationStatus: sent ? 'SENT' : 'FAILED', notificationSentAt: sent ? now : null,
        notificationNextAttemptAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), notificationLeaseUntil: null,
    }).eq('id', id).eq('notificationStatus', 'SENDING');
    if (saveError) throw new Error('Notification result unavailable');
    return sent ? 'SENT' : 'FAILED';
}

export async function retryContactNotifications() {
    const db=getSupabase();
    const {error: recoveryError}=await db.from('ContactMessage').update({notificationStatus:'FAILED',notificationLeaseUntil:null})
        .eq('notificationStatus','SENDING').gte('notificationAttempts',5).lt('notificationLeaseUntil',new Date().toISOString());
    if(recoveryError)throw new Error('Notification recovery unavailable');
    const { data, error } = await db.from('ContactMessage').select('id')
        .in('notificationStatus', ['PENDING','FAILED','SENDING']).lt('notificationAttempts', 5)
        .lte('notificationNextAttemptAt', new Date().toISOString()).order('notificationNextAttemptAt').limit(3);
    if (error) throw new Error('Notification queue unavailable');
    const results = await Promise.allSettled((data || []).map(row => notifyContact(row.id)));
    return { attempted: results.length, sent: results.filter(r => r.status === 'fulfilled' && r.value === 'SENT').length };
}
