import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import AppLayout from '@/components/layout/AppLayout';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import BookList from '@/pages/BookList';
import BookSearch from '@/pages/BookSearch';
import BookDetail from '@/pages/BookDetail';
import ReviewList from '@/pages/ReviewList';
import ReviewEdit from '@/pages/ReviewEdit';
import Stats from '@/pages/Stats';
import Goals from '@/pages/Goals';
import NotFound from '@/pages/NotFound';
import OAuthCallback from '@/pages/OAuthCallback';
import UserProfile from '@/pages/UserProfile';
import Community from '@/pages/Community';
import GroupDetail from '@/pages/GroupDetail';
import Feed from '@/pages/Feed';
import Challenges from '@/pages/Challenges';
import ChallengeDetail from '@/pages/ChallengeDetail';
import Leaderboard from '@/pages/Leaderboard';
import ProtectedRoute from '@/components/ProtectedRoute';

// Design Ref: §5.3 — React Router page routes
// Design Ref: §9.2 — ProtectedRoute wraps authenticated routes
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* Authenticated routes with layout — Plan SC: 미인증 리다이렉트 */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/books" element={<BookList />} />
            <Route path="/books/search" element={<BookSearch />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/reviews" element={<ReviewList />} />
            <Route path="/reviews/:id/edit" element={<ReviewEdit />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/groups/:id" element={<GroupDetail />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenges/:id" element={<ChallengeDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
