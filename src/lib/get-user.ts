import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getAuthenticatedUsername(): Promise<string> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.name) {
      return session.user.name;
    }
  } catch {}

  return 'admin';
}
