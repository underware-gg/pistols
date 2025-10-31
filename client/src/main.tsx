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
import MaintenancePage from '/src/pages/MaintenancePage'
import InternalPageIndex from '/src/pages/internal/InternalPageIndex'
import AdminPage from '/src/pages/internal/AdminPage'
import AirdropPage from '/src/pages/internal/AirdropPage'
import PoolsPage from '/src/pages/internal/PoolsPage'
import SeasonsPage from '/src/pages/internal/SeasonsPage'
import PlayersPage from '/src/pages/internal/PlayersPage'
import SnapshotPage from '/src/pages/internal/SnapshotPage'
import ContractsPage from '/src/pages/internal/ContractsPage'
import MatchmakingTestPage from './pages/internal/MatchmakingTestPage'
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
import ChainSwitchPage from '/src/pages/tests/ChainSwitchPage'
import SocialsTestPage from '/src/pages/tests/SocialsTestPage'
import * as ENV from '/src/utils/env'

//
// REF:
// https://reactrouter.com/6.28.1/routers/create-browser-router
// https://api.reactrouter.com/v7/functions/react_router.createBrowserRouter.html
//
const router = createBrowserRouter(
  [{
    path: '/',
    children: ENV.MAINTENANCE_MODE ? [
      { path: '', element: <MaintenancePage /> },
      { path: '*', element: <MaintenancePage /> },
      { path: "status", element: <StatusPage /> },
    ] : [
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
      { path: "matchmaking", element: <MainPage /> },
      { path: "duels", element: <MainPage /> },
      { path: "graveyard", element: <MainPage /> },
      { path: "invite/:referrer_username", element: <MainPage /> },
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
      { path: "matchmaking", element: <MatchmakingTestPage /> },
    ],
  },
]);

// Helper to check if service worker manifest is ready
async function waitForManifestReady(maxAttempts = 50): Promise<boolean> {
  if (!navigator.serviceWorker.controller) {
    console.warn('⚠️ No service worker controller, skipping manifest check');
    return false;
  }
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await new Promise<{ready: boolean, loading: boolean}>((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => resolve(event.data);
        navigator.serviceWorker.controller!.postMessage(
          { type: 'CHECK_MANIFEST_READY' },
          [messageChannel.port2]
        );
      });
      
      if (response.ready) {
        console.log('✅ Service worker manifest is ready!');
        return true;
      }
      
      if (!response.loading && i > 10) {
        console.warn('⚠️ Manifest failed to load, proceeding anyway...');
        return false;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.warn('⚠️ Error checking manifest readiness:', error);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.warn('⚠️ Timeout waiting for manifest, proceeding anyway...');
  return false;
}

async function init() {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('React root not found');
  
  if ('serviceWorker' in navigator) {
    try {
      console.log('⏳ Setting up game-worker.js...');
      
      // Register our specific service worker
      const registration = await navigator.serviceWorker.register('/game-worker.js', { scope: '/' });
      console.log('🔧 Service worker registered, waiting for activation...');
      
      if (!registration.active) {
        await new Promise<void>((resolve) => {
          // Check installing or waiting states
          const sw = registration.installing || registration.waiting;
          if (sw) {
            sw.addEventListener('statechange', function checkState() {
              if (this.state === 'activated') {
                resolve();
              }
            });
          } else {
            // Already active somehow (edge case)
            resolve();
          }
        });
      }
      
      console.log('✅ game-worker.js is active!');
      
      // CRITICAL: Wait for manifest to be loaded in the service worker
      console.log('⏳ Waiting for asset manifest to load in service worker...');
      await waitForManifestReady();
      
    } catch (error) {
      console.error('❌ Service worker setup failed:', error);
    }
  }

  console.log('🔧 React rendering now...');
  
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
