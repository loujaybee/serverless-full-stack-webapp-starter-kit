import Link from 'next/link';
import { isLocalDevMode } from '@/lib/local-dev';

export default function Header() {
  const localDev = isLocalDevMode();

  return (
    <header className="bg-indigo-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold">
              Todo App
            </Link>
            {localDev && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-300 text-yellow-900"
                title="Auth is bypassed and AWS calls are stubbed."
              >
                LOCAL DEV
              </span>
            )}
          </div>
          {!localDev && (
            <div>
              {/* Use <a> instead of <Link> to trigger a full-page navigation.
                  The sign-out route returns a 302 redirect to Cognito, which
                  would cause a CORS error if fetched via client-side navigation. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/api/auth/sign-out"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
