import React from 'react';
import { useFetchAPI } from '../hooks/useFetchAPI';
import './HomePage.css';

const HomePage = () => {
  const { data, loading, error } = useFetchAPI('http://localhost:8081/api/admin/hello');

  return (
    <div className="home-page">
      <div className="page-container">
        <h1>어드민 대시보드</h1>
        
        {loading && <p className="loading">로딩 중...</p>}
        
        {error && <p className="error">오류: {error}</p>}
        
        {data && (
          <div className="welcome-box">
            <h2>백엔드 메시지</h2>
            <p className="message">{data.message}</p>
            <p className="timestamp">시간: {new Date().toLocaleString('ko-KR')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
