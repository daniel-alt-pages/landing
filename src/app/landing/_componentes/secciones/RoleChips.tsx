'use client';

import Link from 'next/link';
import { HERO } from '../../_contenido/hero';
import { track } from '../../_lib/analytics';

export function RoleChips() {
  return (
    <ul className="ag-chips">
      {HERO.roles.map((role) => (
        <li key={role.id}>
          <Link href={role.href} onClick={() => track('role_select', { role: role.id })}>
            {role.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
