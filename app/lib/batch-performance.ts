export type BatchDeviceProfile = {
  hardwareConcurrency?: number;
  deviceMemory?: number;
  mobile?: boolean;
};

export function selectBatchConcurrency(
  taskCount: number,
  profile: BatchDeviceProfile,
): 1 | 2 {
  if (taskCount < 2 || profile.mobile) return 1;
  if ((profile.hardwareConcurrency ?? 0) < 8) return 1;
  if ((profile.deviceMemory ?? 0) < 8) return 1;
  return 2;
}

export async function runBatchPool<T>(
  items: readonly T[],
  concurrency: number,
  processItem: (item: T) => Promise<void>,
): Promise<void> {
  const workerCount = Math.max(1, Math.min(Math.floor(concurrency), items.length));
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await processItem(item);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}
