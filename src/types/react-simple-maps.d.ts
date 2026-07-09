declare module "react-simple-maps" {
  import type { ComponentType, ReactNode, SVGProps } from "react";

  export interface GeographyObject {
    rsmKey: string;
    [key: string]: unknown;
  }

  export const ComposableMap: ComponentType<
    SVGProps<SVGSVGElement> & {
      projection?: string;
      projectionConfig?: Record<string, unknown>;
      children?: ReactNode;
    }
  >;

  export const Geographies: ComponentType<{
    geography: unknown;
    children: (props: { geographies: GeographyObject[] }) => ReactNode;
  }>;

  export const Geography: ComponentType<
    SVGProps<SVGPathElement> & {
      geography: GeographyObject;
    }
  >;

  export const Marker: ComponentType<{
    coordinates: [number, number];
    children?: ReactNode;
  }>;
}
