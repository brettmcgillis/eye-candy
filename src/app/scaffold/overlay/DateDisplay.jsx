import React from 'react';

export default function DateDisplay() {
  const date = new Date();
  const dateString = `${date.getDate()} | ${date.getMonth() + 1} | ${date.getFullYear()}`;
  return <span>{dateString}</span>;
}
