export const getFormattedDiff = (startAt: Date | undefined): string => {
  if (startAt) {
    const now: Date = new Date();
    const differenceInMs = now.getTime() - startAt.getTime();
    const differenceInSeconds = Math.floor(differenceInMs / 1000);
    const seconds = differenceInSeconds % 60;
    const minutes = Math.floor(differenceInSeconds / 60) % 60;
    const hours = Math.floor(differenceInSeconds / 3600);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return formattedTime;
  }
  return '';
};
