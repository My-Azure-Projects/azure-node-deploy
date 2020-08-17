export default function parsePathToArray(path: string): string[] {
  const normalizedPath = path.replace(/^\.?\/|\/$/g, '');
  return normalizedPath === '' ? [] : normalizedPath.split('/');
}
