import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="text-3xl font-bold text-foreground sm:text-5xl">📚 MyLog</h1>
      <p className="mt-4 px-4 text-center text-base text-muted sm:text-lg">읽고, 기록하고, 성장하는 독서 관리 플랫폼</p>
      <div className="mt-8 flex flex-col gap-3 px-4 sm:flex-row sm:gap-4 sm:px-0">
        <Link
          to="/login"
          className="rounded-lg bg-primary px-6 py-3 text-center text-primary-foreground hover:bg-primary/90"
        >
          로그인
        </Link>
        <Link
          to="/signup"
          className="rounded-lg border border-border px-6 py-3 text-center text-foreground hover:bg-secondary"
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}
