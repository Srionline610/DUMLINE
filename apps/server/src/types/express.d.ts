declare module 'express' {
  import * as http from 'http';
  import { AuthTokenPayload } from '@dumline/shared';

  export interface Request {
    method: string;
    url: string;
    path: string;
    baseUrl?: string;
    ip?: string;
    socket?: any;
    params: Record<string, string>;
    query: Record<string, any>;
    headers: Record<string, string | string[] | undefined>;
    body: any;
    user?: AuthTokenPayload;
  }

  export interface Response {
    status(code: number): this;
    sendStatus(code: number): this;
    json(body: any): this;
    send(body?: any): this;
    header(name: string, value: string): this;
    setHeader?(name: string, value: string): this;
  }

  export type NextFunction = (err?: any) => void;

  export type RequestHandler = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;
  export type ErrorRequestHandler = (err: any, req: Request, res: Response, next: NextFunction) => void | Promise<void>;

  export interface Router {
    use(...handlers: any[]): this;
    get(path: string, ...handlers: any[]): this;
    post(path: string, ...handlers: any[]): this;
    put(path: string, ...handlers: any[]): this;
    patch(path: string, ...handlers: any[]): this;
    delete(path: string, ...handlers: any[]): this;
  }

  export function Router(): Router;

  export interface Express extends Router {
    (req: http.IncomingMessage, res: http.ServerResponse): void;
    listen(port: number, callback?: () => void): http.Server;
  }

  function express(): Express;

  namespace express {
    export function json(): RequestHandler;
    export function urlencoded(options?: any): RequestHandler;
  }

  export default express;
}
