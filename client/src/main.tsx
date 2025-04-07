import 'semantic-ui-css/semantic.min.css'
import '/styles/fonts.scss'
import '/styles/styles.scss'
import '/styles/cards.scss'
import '/styles/book.scss'
import '/styles/poster.scss'
import '/styles/interactiblecomponent.scss'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { SettingsProvider } from '/src/hooks/SettingsContext'
import { PistolsProvider } from '/src/hooks/PistolsContext'
import ErrorModal from '/src/components/modals/ErrorModal'
import MainPage from '/src/pages/MainPage'
import InternalPageIndex from '/src/pages/internal/InternalPageIndex'
import AdminPage from '/src/pages/internal/AdminPage'
import PoolsPage from '/src/pages/internal/PoolsPage'
import SeasonsTestPage from '/src/pages/internal/SeasonsTestPage'
import SnapshotPage from '/src/pages/internal/SnapshotPage'
import DuelDataPage from '/src/pages/DuelDataPage'
import ErrorPage from '/src/pages/error/ErrorPage'
import TestPageIndex from '/src/pages/tests/TestPageIndex'
import ConnectTestPage from '/src/pages/tests/ConnectTestPage'
import IconsTestPage from '/src/pages/tests/IconsTestPage'
import SignTestPage from '/src/pages/tests/SignTestPage'
import TimestampTestPage from '/src/pages/tests/TimestampTestPage'
import TokensTestPage from '/src/pages/tests/TokensTestPage'
import ProfilesTestPage from '/src/pages/tests/ProfilesTestPage'
import TutorialTestPage from '/src/pages/tests/TutorialTestPage'

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
      { path: "leaderboards", element: <MainPage /> },
      { path: "tutorial/entry", element: <MainPage tutorial={true} /> },
      { path: "tutorial/conflict", element: <MainPage tutorial={true} /> },
      { path: "tutorial/honour", element: <MainPage tutorial={true} /> },
      { path: "tutorial/barkeep", element: <MainPage tutorial={true} /> },
      { path: "tutorial/lection", element: <MainPage tutorial={true} /> },
      { path: "tutorial/demon", element: <MainPage tutorial={false} /> },
      { path: "tutorial/resurrection", element: <MainPage tutorial={false} /> },
      { path: "tutorial/duel", element: <MainPage tutorial={true} /> },
      { path: "tutorial/duel/:duel_id", element: <MainPage tutorial={true} /> },
      { path: "tavern/:table_id", element: <MainPage /> },
      { path: "balcony", element: <MainPage /> },
      { path: "balcony/:table_id", element: <MainPage /> },
      { path: "duels", element: <MainPage /> },
      { path: "duels/:table_id", element: <MainPage /> },
      { path: "graveyard", element: <MainPage /> },
      { path: "graveyard/:table_id", element: <MainPage /> },
      { path: "duel/:duel_id", element: <MainPage /> },
      { path: "dueldata/:duel_id", element: <DuelDataPage /> },
    ],
    errorElement: <ErrorPage />,
  },
  // internal pages
  {
    path: '/internal',
    children: [
      { path: "", element: <InternalPageIndex /> },
      { path: "admin", element: <AdminPage /> },
      { path: "pools", element: <PoolsPage /> },
      { path: "seasons", element: <SeasonsTestPage /> },
      { path: "snapshot", element: <SnapshotPage /> },
    ],
  },
  // test pages
  {
    path: '/tests',
    children: [
      { path: "", element: <TestPageIndex /> },
      { path: "connect", element: <ConnectTestPage /> },
      { path: "tokens", element: <TokensTestPage /> },
      { path: "tutorial", element: <TutorialTestPage /> },
      { path: "timestamp", element: <TimestampTestPage /> },
      { path: "profiles", element: <ProfilesTestPage /> },
      { path: "icons", element: <IconsTestPage /> },
      { path: "sign", element: <SignTestPage /> },
    ],
  },
]);

async function init() {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('React root not found');
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  root.render(
    <React.StrictMode>
      <SettingsProvider>
        <PistolsProvider>
          <RouterProvider router={router} />
          <ErrorModal />
        </PistolsProvider>
      </SettingsProvider>
    </React.StrictMode>
  );
}

init();
