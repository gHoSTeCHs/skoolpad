function getCookie(name: string): string | undefined {
    return document.cookie.match(new RegExp(`${name}=([^;]+)`))?.[1];
}

async function csRequest<T>(method: 'POST' | 'PUT', url: string, data: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN') ?? ''),
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
            message?: string;
        };
        throw new Error(body.message ?? `HTTP ${response.status}`);
    }

    return response.json();
}

export async function csPost<T>(url: string, data: Record<string, unknown> = {}): Promise<T> {
    return csRequest<T>('POST', url, data);
}

export async function csPut<T>(url: string, data: Record<string, unknown> = {}): Promise<T> {
    return csRequest<T>('PUT', url, data);
}

export function comparePaths(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const av = pa[i] ?? 0;
        const bv = pb[i] ?? 0;
        if (av !== bv) return av - bv;
    }
    return 0;
}
