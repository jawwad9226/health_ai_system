import os from 'os';

export async function checkSystemLoad(): Promise<boolean> {
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  // Check if load average is too high (over 80% per CPU)
  const normalizedLoad = loadAvg[0] / cpuCount;
  const isLoadOk = normalizedLoad < 0.8;

  // Check if memory usage is too high (over 90%)
  const memoryUsagePercent = (memoryUsage.heapUsed / totalMemory) * 100;
  const isMemoryOk = memoryUsagePercent < 90;

  // Check if free memory is too low (less than 10%)
  const freeMemoryPercent = (freeMemory / totalMemory) * 100;
  const isFreeMemoryOk = freeMemoryPercent > 10;

  return isLoadOk && isMemoryOk && isFreeMemoryOk;
}
