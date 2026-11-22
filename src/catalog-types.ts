// The parts of the host catalog the plugins read (silverpoint Data Model §2.39).
export interface CatalogRole {
  readonly id: string;
  readonly prop: string | null;
  readonly label: string;
  readonly kind: string;
  readonly dataType: string;
  readonly required: boolean;
  readonly multiple: boolean;
}
export interface CatalogOption {
  readonly name: string;
  readonly label: string;
  readonly doc: string;
  readonly kind: string;
  readonly values?: readonly string[];
  readonly default?: boolean | number | string;
}
export interface CatalogChart {
  readonly slug: string;
  readonly title: string;
  readonly family: string;
  readonly summary: string;
  readonly roles: readonly CatalogRole[];
  readonly options: readonly CatalogOption[];
}
