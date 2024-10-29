export const getFormattedDiff = (
  startedAt: string,
  finishedAt: string,
): string => {
  if (startedAt) {
    const from = new Date(startedAt);
    const to = finishedAt ? new Date(finishedAt) : new Date();
    const differenceInMs = to.getTime() - from.getTime();
    const differenceInSeconds = Math.floor(differenceInMs / 1000);
    const seconds = differenceInSeconds % 60;
    const minutes = Math.floor(differenceInSeconds / 60) % 60;
    const hours = Math.floor(differenceInSeconds / 3600);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedTime;
  }
  return '';
};
