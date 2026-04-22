function getCookie(name: string): string | undefined {
    return document.cookie.match(new RegExp(`${name}=([^;]+)`))?.[1];
}

export async function csPost<T>(url: string, data: Record<string, unknown> = {}): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN') ?? ''),
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message ?? 'Request failed');
    }

    return response.json();
}
