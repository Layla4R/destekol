import { retryContactNotifications } from '../../lib/contact-notifications';
export const handler = async () => {
    await retryContactNotifications();
    return { statusCode: 200 };
};
