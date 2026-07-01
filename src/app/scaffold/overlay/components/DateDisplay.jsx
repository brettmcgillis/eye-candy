import React from 'react';

export default function DateDisplay() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  const dateString = `${day}.${month}.${year}`;
  return <span className="date-display">{dateString}</span>;
}
