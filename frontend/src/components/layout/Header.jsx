import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">📊 해피니스 어드민</h1>
        <nav className="header-nav">
          <a href="/">홈</a>
          <a href="/dashboard">대시보드</a>
          <a href="/users">사용자</a>
          <a href="/settings">설정</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
