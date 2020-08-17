import goThroughDir, { AFileDesc, ADirDesc } from './go-through-dir';
import getLocalFile, { FsFileDesc, FsDirDesc } from './get-local-file';

export default function uploadDir<FileMeta, DirMeta>(payload: {
  getClient: (pl: {
    dir: FsDirDesc<DirMeta>;
    file: FsDirDesc<null> | FsFileDesc<null>;
    fileName: string;
  }) => Promise<DirMeta | FileMeta>;
  uploadFile: (pl: { file: FsFileDesc<FileMeta> | FsDirDesc<DirMeta> }) => Promise<void>;
  dir: FsDirDesc<DirMeta>;
}): Promise<void> {
  return goThroughDir<FsFileDesc<FileMeta>, FsDirDesc<DirMeta>>({
    dir: payload.dir,
    async getFile(pl: { dir: FsDirDesc<DirMeta>; fileName: string }) {
      try {
        const result = await getLocalFile<FileMeta, DirMeta>({
          dir: pl.dir,
          fileName: pl.fileName,
          getClient: payload.getClient,
        });
        return result;
      } catch (error) {
        throw new Error(`Cannot get file ${pl.fileName}: ${error.message}`);
      }
    },
    async handleFile(pl) {
      try {
        await payload.uploadFile(pl);
      } catch (error) {
        throw new Error(`Cannot upload file ${pl.file.path}: ${error.message}`);
      }
    },
  });
}
