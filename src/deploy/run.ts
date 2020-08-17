export default async function run({
  fun,
  errorMessage,
  maxTryCount,
  tryCount = 0,
}: {
  fun: () => Promise<void>;
  errorMessage: string;
  maxTryCount: number;
  tryCount?: number;
}): Promise<void> {
  try {
    await fun();
  } catch (error) {
    const finalErrorMessage = `${errorMessage}: ${error.message}`;
    if (tryCount >= maxTryCount) {
      throw new Error(finalErrorMessage);
    }

    console.warn(`#${tryCount + 1}. ${finalErrorMessage}`);
    await run({ fun, errorMessage, maxTryCount, tryCount: tryCount + 1 });
  }
}
