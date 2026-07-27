export function expectAcceptedJobResponse(resp: { status: number; data: any; headers?: any }, jobIdLabel = "job_id") {
  expect(resp.status).toBe(202);
  expect(resp.data).not.toBeNull();
  const jobId = resp.data;
  expect(jobId).toBeDefined();

  const location = resp.headers?.location;
  expect(location).toBeDefined();
  expect(location).toContain(`/api/v1/jobs?job_id=${jobId}`);

  return jobId as string;
}

