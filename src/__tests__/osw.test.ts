import { GeneralApi, OSWApi, OswUpload } from "tdei-client";
import axios from "axios";
import { Utility } from "../utils";
import path from "path";
import * as fs from "fs";

describe("Tests for OSW", () => {
  let configuration = Utility.getConfiguration();

  beforeAll(async () => {
    let generalAPI = new GeneralApi(configuration);
    const loginResponse = await generalAPI.authenticate({
      username: configuration.username,
      password: configuration.password
    });
    configuration.baseOptions = {
      headers: { ...Utility.addAuthZHeader(loginResponse.data.access_token) }
    };
  });

  it("Should get list of osw versions", async () => {
    let oswAPI = new OSWApi(configuration);

    const oswVersions = await oswAPI.listOswVersions();

    expect(oswVersions.status).toBe(200);
    expect(Array.isArray(oswVersions.data.versions)).toBe(true);
  });

  it("Should return list of osw files", async () => {
    let oswAPI = new OSWApi(configuration);

    const oswFiles = await oswAPI.listOswFiles();

    expect(oswFiles.status).toBe(200);
    expect(Array.isArray(oswFiles.data)).toBe(true);
  });

  it("Should be able to upload osw files", async () => {
    let metaToUpload = Utility.getRandomOswUpload();
    const requestInterceptor = (request, fileName) => {
      if (
        request.url === "https://tdei-gateway-dev.azurewebsites.net/api/v1/osw"
      ) {
        let data = request.data as FormData;
        let file = data.get("file") as File;
        delete data["file"];
        delete data["meta"];
        data.set("file", file, fileName);
        data.set("meta", JSON.stringify(metaToUpload));
      }
      return request;
    };
    // Actual method does not give the results as expected
    // So we are writing interceptor
    const uploadInterceptor = axios.interceptors.request.use((req) =>
      requestInterceptor(req, "osw-test-upload.zip")
    );
    let fileDir = path.dirname(path.dirname(__dirname));
    let payloadFilePath = path.join(
      fileDir,
      "assets/payloads/osw/files/valid.zip"
    );
    let filestream = fs.readFileSync(payloadFilePath);
    const blob = new Blob([filestream], { type: "application/zip" });
    let oswAPI = new OSWApi(configuration);

    const uploadedFileResponse = await oswAPI.uploadOswFileForm(
      metaToUpload,
      blob
    );

    expect(uploadedFileResponse.status).toBe(202);
    expect(uploadedFileResponse.data).not.toBeNull();
    axios.interceptors.request.eject(uploadInterceptor);
  });
});
