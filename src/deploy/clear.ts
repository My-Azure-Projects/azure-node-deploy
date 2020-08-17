import goThroughDir, { AFileDesc, ADirDesc } from './go-through-dir';

export interface CFile<Client> extends AFileDesc {
  client: Client;
}

export interface CDir<Client> extends ADirDesc {
  client: Client;
}

export default function clearDir<FileDesc extends AFileDesc, DirDesc extends ADirDesc>(payload: {
  dir: DirDesc;
  getFile: (pl: { fileName: string; dir: DirDesc }) => Promise<FileDesc | DirDesc>;
  deleteFile: (pl: { dir: DirDesc; file: FileDesc | DirDesc }) => Promise<void>;
}): Promise<void> {
  return goThroughDir<FileDesc, DirDesc>({
    dir: payload.dir,
    async getFile(pl) {
      try {
        const result = await payload.getFile(pl);
        return result;
      } catch (error) {
        throw new Error(`Cannot get file ${pl.fileName}: ${error.message}`);
      }
    },
    async handleFile(pl) {
      try {
        await payload.deleteFile(pl);
      } catch (error) {
        throw new Error(`Cannot delete file ${pl.file.path}: ${error.message}`);
      }
    },
  });
}
