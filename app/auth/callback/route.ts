import { createServerClient } from '@/src/lib/postgres/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = cookies();
    const postgres = createServerClient(
      process.env.NEXT_PUBLIC_postgres_URL!,
      process.env.NEXT_PUBLIC_postgres_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Parameters<typeof cookieStore.set>[1]) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Parameters<typeof cookieStore.remove>[0]) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    await postgres.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
