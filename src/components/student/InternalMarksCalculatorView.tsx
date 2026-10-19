import React from 'react';
import { CgpaView } from './CgpaView';

/**
 * @deprecated Internal Calculator has been completely removed from the HIET Student Workspace.
 * All student academic scores and grades are officially accessed via the official Results portal (CgpaView).
 */
export const InternalMarksCalculatorView: React.FC<any> = () => {
  return <CgpaView />;
};
