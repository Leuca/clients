import { ScheduledTaskName } from "../enums/scheduled-task-name.enum";

import { LogService } from "./log.service";

export type TaskIdentifier = {
  taskName?: ScheduledTaskName;
  timeoutId?: number | NodeJS.Timeout;
  intervalId?: number | NodeJS.Timeout;
};

export abstract class TaskSchedulerService {
  protected taskHandlers: Map<string, () => void>;

  constructor(protected logService: LogService) {}

  abstract registerTaskHandler(taskName: ScheduledTaskName, handler: () => void): void;

  abstract unregisterTaskHandler(taskName: ScheduledTaskName): void;

  abstract setTimeout(
    taskName: ScheduledTaskName,
    delayInMs: number,
  ): Promise<number | NodeJS.Timeout>;

  abstract setInterval(
    taskName: ScheduledTaskName,
    intervalInMs: number,
    initialDelayInMs?: number,
  ): Promise<number | NodeJS.Timeout>;

  abstract clearScheduledTask(taskIdentifier: TaskIdentifier): Promise<void>;

  protected abstract triggerTask(taskName: ScheduledTaskName, periodInMinutes?: number): void;
}
