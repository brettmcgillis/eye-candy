import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import DEV_PAGES from './devPageRegistry';
import DevLandingPage from './shell/DevLandingPage';

export default function DevApp() {
  return (
    <Suspense fallback={null}>
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
  );
}
