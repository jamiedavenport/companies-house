// Minimal Swagger 2.0 shapes covering the parts of the spec the fixes touch.
export type Parameter = {
  name?: string;
  in?: string;
  required?: boolean;
  type?: string;
  title?: string;
  paramType?: string;
};

export type Operation = {
  operationId?: string;
  summary?: string;
  "x-operationName"?: string;
  parameters?: Parameter[];
  security?: Record<string, unknown[]>[];
  tags?: string[];
};

export type PathItem = Record<string, unknown>;

export type Tag = { name: string; description?: string; "x-displayName"?: string };

export type Spec = {
  securityDefinitions?: Record<string, unknown>;
  paths: Record<string, PathItem>;
  definitions: Record<string, Record<string, Record<string, unknown>>>;
  tags?: Tag[];
};
