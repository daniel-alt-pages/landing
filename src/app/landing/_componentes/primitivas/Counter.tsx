'use client';

import CountUp from '../bits/CountUp';

export function Counter({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <CountUp
      to={value}
      prefix={prefix}
      suffix={suffix}
      separator="."
      duration={1.2}
      className="ag-stat-num"
    />
  );
}
