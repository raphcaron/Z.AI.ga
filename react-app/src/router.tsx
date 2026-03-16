import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Session } from './pages/Session'
import { Admin } from './pages/Admin'
import { Settings } from './pages/Settings'
import { Auth } from './pages/Auth'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'session/:slug',
        element: <Session />,
      },
      {
        path: 'admin',
        element: <Admin />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'auth',
        element: <Auth />,
      },
    ],
  },
])
