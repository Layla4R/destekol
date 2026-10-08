import { retryContactNotifications } from '../../lib/contact-notifications';

export default async () => {
    await retryContactNotifications();
};
// Netlify runs this only on published deploys, not through a public URL.
export const config = { schedule: '* * * * *' };
