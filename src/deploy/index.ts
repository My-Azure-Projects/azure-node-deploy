import fs from 'fs';
import util from 'util';

import { FsFileDesc, FsDirDesc } from './get-local-file';
import run from './run';
import uploadDir from './upload';
import clearDir, { CDir, CFile } from './clear';

export type { FsFileDesc, FsDirDesc } from './get-local-file';
export type { CFile, CDir } from './clear';

const readDir = util.promisify(fs.readdir);

export default async function deploy<FileClient, DirClient>(pl: {
  rootCDir: DirClient;
  getCDirFiles: (client: DirClient) => Promise<string[]>;
  getCFile: (payload: { fileName: string; dir: CDir<DirClient> }) => Promise<CFile<FileClient> | CDir<DirClient>>;
  deleteCFile: (payload: { file: CFile<FileClient> | CDir<DirClient> }) => Promise<void>;
  rootFSDir: string;
  uploadFSFile: (payload: { file: FsFileDesc<FileClient> | FsDirDesc<DirClient> }) => Promise<void>;
  getClient: (payload: {
    dir: FsDirDesc<DirClient>;
    file: FsDirDesc<null> | FsFileDesc<null>;
    fileName: string;
  }) => Promise<DirClient | FileClient>;
}): Promise<void> {
  const maxTryCount = 10;
  await run({
    maxTryCount,
    errorMessage: 'Cannot clear the dir',
    fun: async () =>
      clearDir<CFile<FileClient>, CDir<DirClient>>({
        dir: { type: 'dir', path: './', files: await pl.getCDirFiles(pl.rootCDir), client: pl.rootCDir },
        deleteFile: pl.deleteCFile,
        getFile: pl.getCFile,
      }),
  });
  await run({
    maxTryCount,
    errorMessage: 'Cannot upload the dir',
    fun: async () =>
      uploadDir<FileClient, DirClient>({
        dir: { type: 'dir', client: pl.rootCDir, path: pl.rootFSDir, files: await readDir(pl.rootFSDir) },
        uploadFile: pl.uploadFSFile,
        getClient: pl.getClient,
      }),
  });
}
