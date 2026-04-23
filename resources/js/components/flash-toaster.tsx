import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { sileo, Toaster } from 'sileo';
import type { Flash } from '@/types';

export function FlashToaster() {
    useEffect(() => {
        function handleFlash(flash: Flash | undefined) {
            if (!flash) return;

            if (flash.success) {
                sileo.success({ title: flash.success });
            }
            if (flash.error) {
                sileo.error({ title: flash.error });
            }
            if (flash.importErrors?.length) {
                sileo.error({
                    title: `${flash.importErrors.length} import ${flash.importErrors.length === 1 ? 'error' : 'errors'}`,
                    description: flash.importErrors.slice(0, 3).join(' · '),
                });
            }
        }

        const initialFlash = (router as unknown as { page?: { props?: { flash?: Flash } } }).page?.props?.flash;
        handleFlash(initialFlash);

        const unsubscribe = router.on('success', (event) => {
            const flash = (event.detail.page.props as { flash?: Flash }).flash;
            handleFlash(flash);
        });

        return unsubscribe;
    }, []);

    return <Toaster position="top-right" />;
}
