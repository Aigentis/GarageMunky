// src/routes/index.tsx
import { useRoutes } from 'react-router-dom';
import { publicRoutes } from './PublicRoutes';
import { protectedRoutes } from './ProtectedRoutes';
import { useUser } from '@/contexts/UserContext'; // Assuming UserContext holds auth status

export const AppRoutes = () => {
  const { isAuthenticated } = useUser(); // Get auth status from context

  // Combine routes - conditionally include protected routes based on auth status
  // Note: A more robust approach might involve a dedicated auth check component/loader
  const commonRoutes = publicRoutes; // Public routes are always available
  const routes = isAuthenticated ? [...commonRoutes, ...protectedRoutes] : commonRoutes;

  // Simple logic for now: Render protected routes if authenticated, otherwise just public.
  // Needs enhancement for proper redirection on accessing protected paths when logged out.

  const element = useRoutes(routes); // Use the determined routes

  return <>{element}</>;
};
