import { AuthenticationApi, CommonAPIsApi, Configuration } from "tdei-client";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { environment } from "../environment/environment";
import { Utility } from "../utils";

const TIMEOUT_MS = 30_000;
const MAX_HOPS = 5;
const UNREGISTERED_REDIRECT_URI = "https://example.com/tdei-api-tester/callback";
const NO_REDIRECT: AxiosRequestConfig = { maxRedirects: 0, validateStatus: () => true };
const SSO_REDIRECT_PATH = "/api/v1/sso-redirect";
const SSO_LOGOUT_PATH = "/api/v1/sso-logout";
const SSO_LOGIN_PATH = "/api/v1/sso-login";

const baseUrl = environment.system.baseUrl!;
const authApi = new AuthenticationApi(new Configuration({ basePath: baseUrl }));

/**
 * SSO takes two hops: gateway -> authentication service -> auth server. Validation happens on the
 * second hop, so follow redirects until the auth server is reached or a non-redirect is returned.
 * Never goes on to the auth server itself: that is the browser's job.
 */
async function followToAuthServer(firstResponse: AxiosResponse): Promise<AxiosResponse> {
  let response = firstResponse;
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    const location: string | undefined = response.headers?.location;
    if (response.status !== 302 || !location || location.includes("/protocol/openid-connect/")) {
      return response;
    }
    response = await axios.get(location, NO_REDIRECT);
  }
  throw new Error(`SSO flow did not reach the auth server within ${MAX_HOPS} redirects`);
}

const getWithoutRedirect = (path: string, params: Record<string, string> = {}) =>
  axios.get(`${baseUrl}${path}`, { ...NO_REDIRECT, params });

const queryOf = (response: AxiosResponse) => new URL(response.headers.location).searchParams;

/** Signs a test user in on the auth server login form, as a browser would, and returns the callback query. */
async function signInThroughAuthServer(redirectUri: string, username: string, password: string): Promise<URLSearchParams> {
  const authorize = await followToAuthServer(await authApi.ssoRedirect(redirectUri, undefined, NO_REDIRECT));
  const loginPage = await axios.get(authorize.headers.location, NO_REDIRECT);
  expect(loginPage.status).toBe(200);

  const action = String(loginPage.data).match(/id="kc-form-login"[^>]*action="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
  if (!action) {
    throw new Error("Auth server login form not found");
  }
  const cookies = (loginPage.headers["set-cookie"] ?? []).map((cookie: string) => cookie.split(";")[0]).join("; ");

  const signedIn = await axios.post(action, new URLSearchParams({ username, password, credentialId: "" }).toString(), {
    ...NO_REDIRECT,
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookies },
  });
  expect(signedIn.status).toBe(302);
  expect(signedIn.headers.location.startsWith(redirectUri)).toBe(true);
  return queryOf(signedIn);
}

describe("SSO redirect", () => {
  it("When request made with redirect_uri, should redirect to the next hop keeping redirect_uri", async () => {
    const response = await authApi.ssoRedirect(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT);

    expect(response.status).toBe(302);
    expect(queryOf(response).get("redirect_uri")).toBe(UNREGISTERED_REDIRECT_URI);
  }, TIMEOUT_MS);

  it("When request made with redirect_uri, should end at the auth server authorization endpoint", async () => {
    const first = await authApi.ssoRedirect(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT);

    const response = await followToAuthServer(first);

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/protocol/openid-connect/auth");
    const query = queryOf(response);
    expect(query.get("response_type")).toBe("code");
    expect(query.get("scope")).toContain("openid");
    expect(query.get("redirect_uri")).toBe(UNREGISTERED_REDIRECT_URI);
    expect(query.get("client_id")).toBeTruthy();
    expect(query.get("state")).toBeTruthy();
  }, TIMEOUT_MS);

  it("When two requests are made, should issue a different state for each", async () => {
    const first = await followToAuthServer(await authApi.ssoRedirect(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT));
    const second = await followToAuthServer(await authApi.ssoRedirect(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT));

    expect(queryOf(first).get("state")).not.toBe(queryOf(second).get("state"));
  }, TIMEOUT_MS);

  it("When request made with a known client_id, should use that client", async () => {
    const defaultFlow = await followToAuthServer(await authApi.ssoRedirect(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT));
    const clientId = queryOf(defaultFlow).get("client_id")!;

    const response = await followToAuthServer(await authApi.ssoRedirect(UNREGISTERED_REDIRECT_URI, clientId, NO_REDIRECT));

    expect(response.status).toBe(302);
    expect(queryOf(response).get("client_id")).toBe(clientId);
  }, TIMEOUT_MS);

  it("When request made without redirect_uri, should respond with bad request", async () => {
    const response = await followToAuthServer(await getWithoutRedirect(SSO_REDIRECT_PATH));

    expect(response.status).toBe(400);
    expect(response.data.errors).toContain("redirect_uri parameter is missing");
  }, TIMEOUT_MS);

  it("When request made with unknown client_id, should respond with bad request", async () => {
    const first = await authApi.ssoRedirect(UNREGISTERED_REDIRECT_URI, "invalid-client", NO_REDIRECT);

    const response = await followToAuthServer(first);

    expect(response.status).toBe(400);
    expect(response.data.message).toBe("Invalid SSO request");
  }, TIMEOUT_MS);

  it("When redirect_uri is not registered, auth server should refuse it and not redirect there", async () => {
    const authorize = await followToAuthServer(await authApi.ssoRedirect(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT));

    const response = await axios.get(authorize.headers.location, NO_REDIRECT);

    expect(response.status).toBe(400);
    expect(response.headers.location).toBeUndefined();
  }, TIMEOUT_MS);
});

describe("SSO logout", () => {
  it("When request made with redirect_uri, should redirect to the next hop keeping redirect_uri", async () => {
    const response = await authApi.ssoLogout(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT);

    expect(response.status).toBe(302);
    expect(queryOf(response).get("redirect_uri")).toBe(UNREGISTERED_REDIRECT_URI);
  }, TIMEOUT_MS);

  it("When request made with redirect_uri, should end at the auth server logout endpoint", async () => {
    const first = await authApi.ssoLogout(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT);

    const response = await followToAuthServer(first);

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain("/protocol/openid-connect/logout");
    const query = queryOf(response);
    expect(query.get("post_logout_redirect_uri")).toBe(UNREGISTERED_REDIRECT_URI);
    expect(query.get("client_id")).toBeTruthy();
  }, TIMEOUT_MS);

  it("When request made with a known client_id, should use that client", async () => {
    const defaultFlow = await followToAuthServer(await authApi.ssoLogout(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT));
    const clientId = queryOf(defaultFlow).get("client_id")!;

    const response = await followToAuthServer(await authApi.ssoLogout(UNREGISTERED_REDIRECT_URI, clientId, NO_REDIRECT));

    expect(response.status).toBe(302);
    expect(queryOf(response).get("client_id")).toBe(clientId);
  }, TIMEOUT_MS);

  it("When request made without redirect_uri, should respond with bad request", async () => {
    const response = await followToAuthServer(await getWithoutRedirect(SSO_LOGOUT_PATH));

    expect(response.status).toBe(400);
    expect(response.data.errors).toContain("redirect_uri parameter is missing");
  }, TIMEOUT_MS);

  it("When request made with unknown client_id, should respond with bad request", async () => {
    const first = await authApi.ssoLogout(UNREGISTERED_REDIRECT_URI, "invalid-client", NO_REDIRECT);

    const response = await followToAuthServer(first);

    expect(response.status).toBe(400);
    expect(response.data.message).toBe("Invalid SSO request");
  }, TIMEOUT_MS);
});

describe("SSO login", () => {
  it("When request made with a valid code and state, should respond with access and refresh tokens that work", async () => {
    const redirectUri = environment.sso.redirectUri;
    if (!redirectUri) {
      throw new Error("SSO_REDIRECT_URI must be set for this environment");
    }
    const { username, password } = Utility.seedData.users.poc;
    const callback = await signInThroughAuthServer(redirectUri, username!, password!);

    const response = await authApi.ssoLogin({ code: callback.get("code")!, state: callback.get("state")! });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
      expires_in: expect.any(Number),
      refresh_expires_in: expect.any(Number),
    });
    const tokenConfiguration = new Configuration({
      basePath: baseUrl,
      baseOptions: { headers: Utility.addAuthZHeader(response.data.access_token) },
    });
    expect((await new CommonAPIsApi(tokenConfiguration).listProjectGroups()).status).toBe(200);
  }, TIMEOUT_MS);

  it("When request made without code and state, should respond with bad request naming both", async () => {
    const response = await axios.post(`${baseUrl}${SSO_LOGIN_PATH}`, {}, NO_REDIRECT);

    expect(response.status).toBe(400);
    expect(response.data.errors).toEqual(expect.arrayContaining([expect.stringContaining("code"), expect.stringContaining("state")]));
  }, TIMEOUT_MS);

  it("When request made without state, should respond with bad request", async () => {
    const response = authApi.ssoLogin({ code: "invalid" } as any);

    await expect(response).rejects.toMatchObject({ response: { status: 400, data: { errors: [expect.stringContaining("state")] } } });
  }, TIMEOUT_MS);

  it("When request made without code, should respond with bad request", async () => {
    const response = authApi.ssoLogin({ state: "invalid" } as any);

    await expect(response).rejects.toMatchObject({ response: { status: 400, data: { errors: [expect.stringContaining("code")] } } });
  }, TIMEOUT_MS);

  it("When request made with invalid state, should respond with unauthenticated request", async () => {
    const response = authApi.ssoLogin({ code: "invalid", state: "invalid" });

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });
  }, TIMEOUT_MS);

  it("When request made with a genuine state but invalid code, should respond with unauthenticated request", async () => {
    const authorize = await followToAuthServer(await authApi.ssoRedirect(UNREGISTERED_REDIRECT_URI, undefined, NO_REDIRECT));
    const state = queryOf(authorize).get("state")!;

    const response = authApi.ssoLogin({ code: "invalid", state });

    await expect(response).rejects.toMatchObject({ response: { status: 401 } });
  }, TIMEOUT_MS);
});
