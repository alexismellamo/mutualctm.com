import { validateSession } from '../utils/auth';

type GuardContext = {
  cookie: { session?: { value?: string } };
  status: (code: number) => unknown;
};

export const withAuth = {
  beforeHandle: async ({ cookie: { session }, status }: GuardContext) => {
    const ok = await validateSession(session?.value);
    if (!ok) return status(401);
  },
};


