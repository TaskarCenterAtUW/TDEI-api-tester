import type { CommonAPIsApi, JobDetails } from "tdei-client";

type JobId = string | number;

export type JobPollSnapshot = {
  job_id?: string;
  status?: string;
  job_type?: string;
  message?: string | null;
  download_url?: string | null;
  current_stage?: string | null;
  progress?: unknown;
  updated_at?: string | null;
};

export type WaitForJobOptions = {
  api: CommonAPIsApi;
  projectGroupId?: string; // some roles pass "" in existing tests
  jobId: JobId;
  deadlineMs: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  terminalStatuses?: string[];
  onPoll?: (info: {
    attempt: number;
    elapsedMs: number;
    nextDelayMs: number;
    snapshot?: JobPollSnapshot;
  }) => void | Promise<void>;
};

export type WaitForJobResult = {
  job?: JobDetails;
  attempts: number;
  elapsedMs: number;
  lastSnapshot?: JobPollSnapshot;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(ms: number, ratio: number) {
  const r = Math.max(0, Math.min(1, ratio));
  const delta = ms * r;
  return Math.max(0, Math.round(ms - delta + Math.random() * (2 * delta)));
}

function toSnapshot(job?: JobDetails): JobPollSnapshot | undefined {
  if (!job) return undefined;
  return {
    job_id: (job as any).job_id,
    status: (job as any).status,
    job_type: (job as any).job_type,
    message: (job as any).message ?? null,
    download_url: (job as any).download_url ?? null,
    current_stage: (job as any).current_stage ?? null,
    progress: (job as any).progress,
    updated_at: (job as any).updated_at ?? null,
  };
}

export async function waitForJobTerminalState(options: WaitForJobOptions): Promise<WaitForJobResult> {
  const {
    api,
    projectGroupId = "",
    jobId,
    deadlineMs,
    initialDelayMs = 750,
    maxDelayMs = 10_000,
    terminalStatuses = ["COMPLETED", "FAILED"],
    onPoll,
  } = options;

  const start = Date.now();
  let attempt = 0;
  let delayMs = Math.max(0, initialDelayMs);
  let lastJob: JobDetails | undefined;
  let lastSnapshot: JobPollSnapshot | undefined;

  while (true) {
    const elapsedMs = Date.now() - start;
    if (elapsedMs > deadlineMs) {
      const snapshotText = lastSnapshot ? JSON.stringify(lastSnapshot, null, 2) : "null";
      throw new Error(
        [
          `Timed out waiting for job to reach terminal state.`,
          `job_id=${jobId}`,
          `elapsed_ms=${elapsedMs}`,
          `deadline_ms=${deadlineMs}`,
          `attempts=${attempt}`,
          `last_snapshot=${snapshotText}`,
        ].join("\n")
      );
    }

    attempt += 1;

    const resp = await api.listJobs(projectGroupId, jobId as any, true);
    const job = (Array.isArray(resp.data) ? resp.data[0] : undefined) as any as JobDetails | undefined;
    lastJob = job;
    lastSnapshot = toSnapshot(job);

    const status = (job as any)?.status as string | undefined;
    const isTerminal = !!status && terminalStatuses.includes(status);

    const nextDelayMs = Math.min(maxDelayMs, Math.max(250, jitter(delayMs, 0.2)));
    if (onPoll) {
      await onPoll({ attempt, elapsedMs, nextDelayMs, snapshot: lastSnapshot });
    }

    if (status === "FAILED") {
      const snapshotText = lastSnapshot ? JSON.stringify(lastSnapshot, null, 2) : "null";
      throw new Error(
        [
          `Job reached FAILED status.`,
          `job_id=${jobId}`,
          `elapsed_ms=${elapsedMs}`,
          `attempts=${attempt}`,
          `last_snapshot=${snapshotText}`,
        ].join("\n")
      );
    }

    if (isTerminal) {
      return { job: lastJob, attempts: attempt, elapsedMs, lastSnapshot };
    }

    await sleep(nextDelayMs);
    delayMs = Math.min(maxDelayMs, delayMs * 1.6);
  }
}

