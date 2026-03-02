import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success('You are back online! 🟢', { id: 'network-status' });
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error('You are offline. Switching to Basic Mode. 🟠', { id: 'network-status' });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline };
}
