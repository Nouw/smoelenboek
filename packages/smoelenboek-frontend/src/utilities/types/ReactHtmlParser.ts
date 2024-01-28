 

declare module 'react-html-parser' {
  import { ReactElement } from 'react';

  interface Node {
    type: string;
    name: string;
    children: any[];
    next: any;
    prev: any;
    parent: any;
    data: string;
  }

  type TransformFunction = (
    node: Node,
    index: number
  ) => ReactElement<any> | undefined | null;

  export default function ReactHtmlParser(
    html: string,
    options?: {
      decodeEntities?: boolean;
      transform?: TransformFunction;
      preprocessNodes?: (nodes: any) => any;
    }
  ): ReactElement<any>;

  export function convertNodeToElement(
    node: Node,
    index: number,
    transform: TransformFunction
  ): ReactElement<any>;
}
