import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h1 className="text-6xl font-bold text-muted">404</h1>
      <p className="mt-4 text-lg text-muted">페이지를 찾을 수 없습니다.</p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-lg bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
      >
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
