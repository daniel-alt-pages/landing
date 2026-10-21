import type { LucideIcon } from 'lucide-react';

export type Icon = LucideIcon;
export type LandingTone = 'dark' | 'light';
export type SalesLeadKind = 'individual' | 'institution';
export type SalesLeadStep =
  | 'kind'
  | 'name'
  | 'role'
  | 'location'
  | 'institution'
  | 'volume'
  | 'application'
  | 'contact'
  | 'notes';

export type ColombiaCatalogItem = {
  name: string;
  department?: string;
  municipality?: string;
};

export type ColombiaSalesCatalog = {
  generatedAt?: string;
  departments: ColombiaCatalogItem[];
  municipalities: ColombiaCatalogItem[];
  schools: ColombiaCatalogItem[];
};
