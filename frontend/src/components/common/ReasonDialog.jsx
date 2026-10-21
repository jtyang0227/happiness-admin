import React, { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import './ReasonDialog.css';

const REASON_MIN = 5;

/** 개인정보 열람·다운로드 전 처리 사유를 받는 다이얼로그 — 사유는 개인정보 접속기록에 함께 남는다. */
const ReasonDialog = ({ open, title, description, confirmLabel = '확인', busy = false, onSubmit, onClose }) => {
  const [reason, setReason] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setReason('');
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [open, busy, onClose]);

  if (!open) return null;
  const valid = reason.trim().length >= REASON_MIN;

  return (
    <div className="modal-overlay" onClick={() => !busy && onClose()}>
      <div className="modal-dialog reason-dialog" role="dialog" aria-modal="true" aria-labelledby="reason-dialog-title" onClick={e => e.stopPropagation()}>
        <div className="reason-dialog-icon"><Lock size={20} /></div>
        <h3 className="modal-title" id="reason-dialog-title">{title}</h3>
        <p className="modal-desc">{description}</p>
        <label className="modal-label" htmlFor="reason-dialog-input">처리 사유 (필수, {REASON_MIN}자 이상)</label>
        <textarea
          id="reason-dialog-input"
          ref={inputRef}
          className="modal-textarea"
          rows={3}
          maxLength={300}
          placeholder="예: 본인 확인 요청 문의 대응(문의 #123)"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <p className="reason-dialog-hint">사유·시각·접속 IP가 개인정보 접속기록에 남습니다.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost btn-md" onClick={onClose} disabled={busy}>취소</button>
          <button type="button" className="btn btn-primary btn-md" onClick={() => onSubmit(reason.trim())} disabled={!valid || busy}>
            {busy ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReasonDialog;
