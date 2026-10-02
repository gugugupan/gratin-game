import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

export function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="app-header">
      <Link className="brand" to="/">
        <img className="logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width={32} height={32} />
        <span className="brand-text">
          <span className="brand-en">Gridlands</span>
          <span className="brand-zh">阡陌</span>
        </span>
      </Link>
      <div className="toolbar">{children}</div>
    </header>
  );
}
