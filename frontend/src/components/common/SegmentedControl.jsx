import React from 'react';
import './SegmentedControl.css';

const SegmentedControl = ({ options, value, onChange, ariaLabel }) => (
  <div className="segmented" role="tablist" aria-label={ariaLabel}>
    {options.map(o => (
      <button
        key={o.value}
        type="button"
        role="tab"
        aria-selected={value === o.value}
        className={`segmented-item${value === o.value ? ' active' : ''}`}
        onClick={() => onChange(o.value)}
      >
        {o.label}
        {o.count != null && <span className="segmented-count">{o.count}</span>}
      </button>
    ))}
  </div>
);

export default SegmentedControl;
