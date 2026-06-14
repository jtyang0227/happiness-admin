import React, { createContext, useContext, useRef, useState } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({ open: false, title: '', description: '', variant: 'danger' });
  const resolveRef = useRef(null);

  const confirm = ({ title, description, variant = 'danger' }) =>
    new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, title, description, variant });
    });

  const handleConfirm = () => {
    resolveRef.current?.(true);
    setState((s) => ({ ...s, open: false }));
  };

  const handleCancel = () => {
    resolveRef.current?.(false);
    setState((s) => ({ ...s, open: false }));
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={state.open}
        title={state.title}
        description={state.description}
        variant={state.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
