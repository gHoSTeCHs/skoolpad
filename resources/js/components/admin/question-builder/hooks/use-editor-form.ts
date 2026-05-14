'use no memo';

import { useForm } from '@inertiajs/react';
import type { FormDataType } from '@inertiajs/core';
import { useCallback } from 'react';
import { useDirtyRegistration } from './use-dirty-registration';

interface SubmitOptions {
    only?: string[];
    preserveState?: boolean;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
}

/**
 * Thin wrapper over Inertia's useForm that wires a surface into the builder's
 * dirty contract: it registers the form's dirty state (and a stable reset) via
 * useDirtyRegistration, and its `submit` calls setDefaults() on success so
 * `isDirty` clears after a save instead of lingering.
 */
export function useEditorForm<T extends FormDataType<T>>(key: string, initial: T) {
    const form = useForm<T>(initial);

    const reset = useCallback(() => form.reset(), [form]);
    useDirtyRegistration(key, form.isDirty, reset);

    const submit = useCallback(
        (method: 'post' | 'put', url: string, options: SubmitOptions = {}) => {
            form[method](url, {
                preserveScroll: true,
                preserveState: options.preserveState,
                only: options.only,
                onSuccess: () => {
                    form.setDefaults();
                    options.onSuccess?.();
                },
                onError: (errors) => {
                    options.onError?.(errors as Record<string, string>);
                },
            });
        },
        [form],
    );

    return { form, reset, submit };
}
