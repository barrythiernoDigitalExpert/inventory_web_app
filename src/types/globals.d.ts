declare module 'swagger-jsdoc' {
  interface Options {
    definition: object;
    apis: string[];
    [key: string]: unknown;
  }
  function swaggerJsdoc(options: Options): object;
  namespace swaggerJsdoc {
    export { Options };
  }
  export = swaggerJsdoc;
}

declare module 'swagger-ui-react' {
  import { ComponentType } from 'react';

  interface SwaggerUIProps {
    url?: string;
    spec?: object;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    tryItOutEnabled?: boolean;
    [key: string]: unknown;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
