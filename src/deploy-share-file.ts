import fs from 'fs';
import path from 'path';
import util from 'util';

import { ShareServiceClient, ShareDirectoryClient, ShareClient, ShareFileClient } from '@azure/storage-file-share';

import deploy, { CFile, CDir, FsFileDesc, FsDirDesc } from './deploy';
import parsePathToArray from './utils/parse-path-to-array';

const readFile = util.promisify(fs.readFile);

function getServerDirClient([dirName, ...dirs]: string[], parentDirClient: ShareDirectoryClient): ShareDirectoryClient {
  if (typeof dirName === 'undefined') {
    return parentDirClient;
  }

  const dir: ShareDirectoryClient = parentDirClient.getDirectoryClient(dirName);
  return dirs.length > 0 ? getServerDirClient(dirs, dir) : dir;
}

async function getDirFiles(dirClient: ShareDirectoryClient): Promise<string[]> {
  const files: string[] = [];
  for await (const { name } of dirClient.listFilesAndDirectories()) {
    files.push(name);
  }
  return files;
}

async function getStorageClient(serviceClient: ShareServiceClient, storageName: string | null): Promise<ShareClient> {
  if (typeof storageName === 'string') {
    return serviceClient.getShareClient(storageName);
  }

  const shareItem = await serviceClient.listShares().next();
  return serviceClient.getShareClient(shareItem.value.name);
}

interface Options {
  connectionString: string;
  storageName?: string;
  from?: string;
  to?: string;
}

export default async function deployShareFiles({
  connectionString,
  storageName = null,
  from = './',
  to = './site/wwwroot/',
}: Options): Promise<void> {
  const serviceClient: ShareServiceClient = ShareServiceClient.fromConnectionString(connectionString);
  const storageClient: ShareClient = await getStorageClient(serviceClient, storageName);

  return deploy<ShareFileClient, ShareDirectoryClient>({
    rootCDir: getServerDirClient(parsePathToArray(to), storageClient.rootDirectoryClient),
    rootFSDir: from,
    getCDirFiles: getDirFiles,
    async getCFile(payload: {
      fileName: string;
      dir: CDir<ShareDirectoryClient>;
    }): Promise<CFile<ShareFileClient> | CDir<ShareDirectoryClient>> {
      let isDir = false;
      for await (const { kind } of payload.dir.client.listFilesAndDirectories()) {
        if (kind === 'directory') {
          isDir = true;
          break;
        }
      }
      if (isDir) {
        const client: ShareDirectoryClient = payload.dir.client.getDirectoryClient(payload.fileName);
        return {
          type: 'dir',
          path: path.join(payload.dir.path, payload.fileName),
          client,
          files: await getDirFiles(client),
        };
      }
      return {
        type: 'file',
        path: path.join(payload.dir.path, payload.fileName),
        client: payload.dir.client.getFileClient(payload.fileName),
      };
    },
    async deleteCFile(payload: { file: CFile<ShareFileClient> | CDir<ShareDirectoryClient> }): Promise<void> {
      await payload.file.client.delete();
    },
    async uploadFSFile(payload: {
      file: FsFileDesc<ShareFileClient> | FsDirDesc<ShareDirectoryClient>;
    }): Promise<void> {
      if (payload.file.type === 'dir') return;

      const content: Buffer = await readFile(payload.file.path);
      await payload.file.client.create(content.length);
      await payload.file.client.uploadRange(content, 0, content.length);
    },
    async getClient(payload: {
      dir: FsDirDesc<ShareDirectoryClient>;
      file: FsDirDesc<null> | FsFileDesc<null>;
      fileName: string;
    }): Promise<ShareDirectoryClient | ShareFileClient> {
      if (payload.file.type === 'file') {
        return payload.dir.client.getFileClient(payload.fileName);
      }

      const client = payload.dir.client.getDirectoryClient(payload.fileName);
      await client.create();
      return client;
    },
  });
}
