import * as actionsExec from "@actions/exec";
export declare const _fns: {
    exec: typeof actionsExec.exec;
    setFailed: (msg: string | Error) => void;
    setSecret: (secret: string) => void;
    info: (msg: string) => void;
};
export declare function run(): Promise<void>;
