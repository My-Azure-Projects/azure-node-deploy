export interface AFileDesc {
  type: 'file';
  path: string;
}

export interface ADirDesc {
  type: 'dir';
  path: string;
  files: string[];
}

export default async function goThroughDir<FileDesc extends AFileDesc, DirDesc extends ADirDesc>(payload: {
  dir: DirDesc;
  getFile: (pl: { dir: DirDesc; fileName: string }) => Promise<DirDesc | FileDesc>;
  handleFile: (pl: { dir: DirDesc; file: FileDesc | DirDesc }) => Promise<void>;
}): Promise<void> {
  await Promise.all(
    payload.dir.files.map(async (fileName: string) => {
      const file = await payload.getFile({ dir: payload.dir, fileName });
      if (file.type === 'dir') {
        await goThroughDir({ dir: file, getFile: payload.getFile, handleFile: payload.handleFile });
      }
      await payload.handleFile({ dir: payload.dir, file });
    }),
  );
}
