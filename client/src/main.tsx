import 'semantic-ui-css/semantic.min.css'
import '/styles/fonts.scss'
import '/styles/styles.scss'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { SettingsProvider } from '/src/hooks/SettingsContext'
import { PistolsProvider } from '/src/hooks/PistolsContext'
import ErrorModal from '/src/components/modals/ErrorModal'
import MainPage from '/src/pages/MainPage'
import InternalPageIndex from '/src/pages/internal/InternalPageIndex'
import AdminPage from '/src/pages/internal/AdminPage'
import AirdropPage from '/src/pages/internal/AirdropPage'
import PoolsPage from '/src/pages/internal/PoolsPage'
import SeasonsPage from '/src/pages/internal/SeasonsPage'
import PlayersPage from '/src/pages/internal/PlayersPage'
import SnapshotPage from '/src/pages/internal/SnapshotPage'
import ContractsPage from '/src/pages/internal/ContractsPage'
import DuelDataPage from '/src/pages/DuelDataPage'
import StatusPage from '/src/pages/StatusPage'
import ErrorPage from '/src/pages/error/ErrorPage'
import TestPageIndex from '/src/pages/tests/TestPageIndex'
import ConnectTestPage from '/src/pages/tests/ConnectTestPage'
import IconsTestPage from '/src/pages/tests/IconsTestPage'
import SignTestPage from '/src/pages/tests/SignTestPage'
import TimestampTestPage from '/src/pages/tests/TimestampTestPage'
import TokensTestPage from '/src/pages/tests/TokensTestPage'
import ProfilesTestPage from '/src/pages/tests/ProfilesTestPage'
import TutorialTestPage from '/src/pages/tests/TutorialTestPage'
import ChainSwitchPage from './pages/tests/ChainSwitchPage'
import SocialsTestPage from './pages/tests/SocialsTestPage'

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
      { path: "profile", element: <MainPage /> },
      { path: "profile/cardpacks", element: <MainPage /> },
      { path: "profile/duelistbook", element: <MainPage /> },
      { path: "tavern", element: <MainPage /> },
      { path: "leaderboards", element: <MainPage /> },
      { path: "tutorial/entry", element: <MainPage /> },
      { path: "tutorial/conflict", element: <MainPage /> },
      { path: "tutorial/honour", element: <MainPage /> },
      { path: "tutorial/barkeep", element: <MainPage /> },
      { path: "tutorial/lection", element: <MainPage /> },
      { path: "tutorial/demon", element: <MainPage /> },
      { path: "tutorial/resurrection", element: <MainPage /> },
      { path: "tutorial/duel", element: <MainPage /> },
      { path: "tutorial/duel/:duel_id", element: <MainPage /> },
      { path: "balcony", element: <MainPage /> },
      { path: "duels", element: <MainPage /> },
      { path: "graveyard", element: <MainPage /> },
      { path: "duel/:duel_id", element: <MainPage /> },
      { path: "dueldata/:duel_id", element: <DuelDataPage /> },
      { path: "status", element: <StatusPage /> },
    ],
    errorElement: <ErrorPage />,
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
      { path: "chainswitch", element: <ChainSwitchPage /> },
      { path: "socials", element: <SocialsTestPage /> },
    ],
  },
  // internal pages
  {
    path: '/internal',
    children: [
      { path: "", element: <InternalPageIndex /> },
      { path: "admin", element: <AdminPage /> },
      { path: "airdrop", element: <AirdropPage /> },
      { path: "pools", element: <PoolsPage /> },
      { path: "seasons", element: <SeasonsPage /> },
      { path: "players", element: <PlayersPage /> },
      { path: "snapshot", element: <SnapshotPage /> },
      { path: "contracts", element: <ContractsPage /> },
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
