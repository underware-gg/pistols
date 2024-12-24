import 'semantic-ui-css/semantic.min.css'
import '/styles/fonts.scss'
import '/styles/styles.scss'
import '/styles/cards.scss'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { SettingsProvider } from '@/hooks/SettingsContext'
import { PistolsProvider } from '@/hooks/PistolsContext'
import { makeDojoAppConfig } from '@underware_gg/pistols-sdk/pistols'
import { Dojo } from '@underware_gg/pistols-sdk/dojo'
import ErrorModal from '@/components/modals/ErrorModal'
import MainPage from '@/pages/MainPage'
import SnapshotPage from '@/pages/internal/SnapshotPage'
import AdminPage from '@/pages/internal/AdminPage'
import ConnectPage from '@/pages/tests/ConnectPage'
import IconsPage from '@/pages/tests/IconsPage'
import SignPage from '@/pages/tests/SignPage'
import TimestampPage from '@/pages/tests/TimestampPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainPage />,
  },
  {
    path: '/gate',
    element: <MainPage />,
  },
  {
    path: '/door',
    element: <MainPage />,
  },
  {
    path: '/tavern',
    element: <MainPage />,
  },
  {
    path: '/profile',
    element: <MainPage />,
  },
  {
    path: '/duelists',
    element: <MainPage />,
  },
  {
    path: '/graveyard',
    element: <MainPage />,
  },
  {
    path: '/duels',
    element: <MainPage />,
  },
  {
    path: '/duel',
    element: <MainPage />,
  },
  {
    path: '/live',
    element: <MainPage />,
  },
  {
    path: '/balcony',
    element: <MainPage />,
  },
  // internal pages
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/admin/snapshot',
    element: <SnapshotPage />,
  },
  // test pages
  {
    path: '/tests/connect',
    element: <ConnectPage />,
  },
  {
    path: '/tests/icons',
    element: <IconsPage />,
  },
  {
    path: '/tests/sign',
    element: <SignPage />,
  },
  {
    path: '/tests/timestamp',
    element: <TimestampPage />,
  },
]);

async function init() {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('React root not found');
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  const dojoAppConfig = makeDojoAppConfig();

  root.render(
    <React.StrictMode>
      <SettingsProvider>
        <PistolsProvider>
          <Dojo dojoAppConfig={dojoAppConfig}>
            <RouterProvider router={router} />
            <ErrorModal />
          </Dojo>
        </PistolsProvider>
      </SettingsProvider>
    </React.StrictMode>
  );
}

init();
