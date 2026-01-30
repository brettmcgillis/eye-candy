import React from 'react';

export default function VersionTag() {
  const version = __APP_VERSION__;
  return <div className="version-tag">v. {version}</div>;
}
