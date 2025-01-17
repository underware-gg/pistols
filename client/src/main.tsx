import 'semantic-ui-css/semantic.min.css'
import '/styles/fonts.scss'
import '/styles/styles.scss'
import '/styles/cards.scss'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { makeDojoAppConfig } from '@underware_gg/pistols-sdk/pistols'
import { SettingsProvider } from '/src/hooks/SettingsContext'
import { PistolsProvider } from '/src/hooks/PistolsContext'
import { Dojo } from '@underware_gg/pistols-sdk/dojo'
import ErrorModal from '/src/components/modals/ErrorModal'
import MainPage from '/src/pages/MainPage'
import SnapshotPage from '/src/pages/internal/SnapshotPage'
import AdminPage from '/src/pages/internal/AdminPage'
import ConnectPage from '/src/pages/tests/ConnectPage'
import IconsPage from '/src/pages/tests/IconsPage'
import SignPage from '/src/pages/tests/SignPage'
import TimestampPage from '/src/pages/tests/TimestampPage'
import TokensPage from '/src/pages/tests/TokensPage'
import DuelistProfilesPage from '/src/pages/tests/DuelistProfilesPage'
import DuelDataPage from '/src/pages/DuelDataPage'
import ErrorPage from '/src/pages/error/ErrorPage'

//
// REF:
// https://reactrouter.com/6.28.1/routers/create-browser-router
// https://api.reactrouter.com/v7/functions/react_router.createBrowserRouter.html
//
const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { path: "", element: <MainPage /> },
      { path: "gate", element: <MainPage /> },
      { path: "door", element: <MainPage /> },
      { path: "door/:table_id", element: <MainPage /> },
      { path: "profile", element: <MainPage /> },
      { path: "profile/:table_id", element: <MainPage /> },
      { path: "tavern", element: <MainPage /> },
      { path: "tavern/:table_id", element: <MainPage /> },
      { path: "balcony", element: <MainPage /> },
      { path: "balcony/:table_id", element: <MainPage /> },
      { path: "duels", element: <MainPage /> },
      { path: "duels/:table_id", element: <MainPage /> },
      { path: "graveyard", element: <MainPage /> },
      { path: "graveyard/:table_id", element: <MainPage /> },
      { path: "duel/:duel_id", element: <MainPage /> },
    ],
    errorElement: <ErrorPage />,
  },
  {
    path: '/dueldata/:duel_id',
    element: <DuelDataPage />,
  },
  // internal pages
  {
    path: '/internal',
    children: [
      { path: "admin", element: <AdminPage /> },
      { path: "snapshot", element: <SnapshotPage /> },
    ],
  },
  // test pages
  {
    path: '/tests',
    children: [
      { path: "connect", element: <ConnectPage /> },
      { path: "icons", element: <IconsPage /> },
      { path: "sign", element: <SignPage /> },
      { path: "timestamp", element: <TimestampPage /> },
      { path: "tokens", element: <TokensPage /> },
      { path: "profiles", element: <DuelistProfilesPage /> },
    ],
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
