export interface ICouchbaseLitePlugin {
  exec(actionName: string, ...args: any[]): Promise<any>;
  watch(actionName: string, args: any[], cb: (data: any) => void, err: (err: any) => void): void;
}

export interface Dictionary { [key: string]: any; }
