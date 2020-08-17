import fs from 'fs';
import path from 'path';
import util from 'util';

import { AFileDesc, ADirDesc } from './go-through-dir';

export interface FsFileDesc<Client> extends AFileDesc {
  client: Client;
}

export interface FsDirDesc<Client> extends ADirDesc {
  client: Client;
}

const readDir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

export default async function getLocalFile<FileMeta, DirMeta>(payload: {
  fileName: string;
  dir: FsDirDesc<DirMeta>;
  getClient?: (pl: {
    dir: FsDirDesc<DirMeta>;
    file: FsDirDesc<null> | FsFileDesc<null>;
    fileName: string;
  }) => Promise<DirMeta | FileMeta>;
}): Promise<FsDirDesc<DirMeta> | FsFileDesc<FileMeta>> {
  const filePath: string = path.join(payload.dir.path, payload.fileName);
  const fileStat: fs.Stats = await stat(filePath);
  const isDirectory: boolean = fileStat.isDirectory();
  const file: FsDirDesc<null> | FsFileDesc<null> = {
    path: filePath,
    type: isDirectory ? 'dir' : 'file',
    files: isDirectory ? await readDir(filePath) : undefined,
    client: null,
  };

  return {
    ...file,
    client:
      typeof payload.getClient === 'function'
        ? await payload.getClient({ file, dir: payload.dir, fileName: payload.fileName })
        : null,
  } as FsDirDesc<DirMeta> | FsFileDesc<FileMeta>;
}
