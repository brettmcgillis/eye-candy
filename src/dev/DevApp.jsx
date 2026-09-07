import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import useDocumentTitle from '@app/scaffold/hooks/useDocumentTitle';
import Loader from '@app/scaffold/loader/Loader';
import SuspenseSignal from '@app/scaffold/loader/SuspenseSignal';
import useLoaderGate from '@app/scaffold/loader/useLoaderGate';

import DEV_PAGES from './devPageRegistry';
import DevLandingPage from './shell/DevLandingPage';
import { DevThemeProvider } from './shell/theme/DevThemeContext';

const DEV_LABELS = new Map(
  DEV_PAGES.flatMap(({ aliases, label, slug }) =>
    [slug, ...aliases].map((routeName) => [routeName, label])
  )
);

function useDevPageTitle() {
  const { pathname } = useLocation();
  const routeName = pathname.replace(/^\/dev\/?/u, '').replace(/\/+$/u, '');

  useDocumentTitle(DEV_LABELS.get(routeName) ?? 'Dev');
}

export default function DevApp() {
  useDevPageTitle();

  const { loaderVisible, suspended, handleSuspend, onLoaderComplete } =
    useLoaderGate();

  return (
    <DevThemeProvider>
      <Suspense fallback={<SuspenseSignal onSuspend={handleSuspend} />}>
        <Routes>
          <Route index element={<DevLandingPage />} />
          {DEV_PAGES.flatMap(({ aliases, Component, slug }) =>
            [slug, ...aliases].map((routePath) => (
              <Route key={routePath} path={routePath} element={<Component />} />
            ))
          )}
          <Route path="*" element={<Navigate to="/dev" replace />} />
        </Routes>
      </Suspense>
      {loaderVisible && (
        <Loader onComplete={onLoaderComplete} suspended={suspended} />
      )}
    </DevThemeProvider>
  );
}
