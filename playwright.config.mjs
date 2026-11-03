import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./tests/e2e",
 timeout:30000,
 expect:{timeout:10000},
 retries:process.env.CI?1:0,
 use:{baseURL:"http://127.0.0.1:3100",trace:"retain-on-failure",...devices["Desktop Chrome"]},
 webServer:{command:"npm run dev -- --hostname 127.0.0.1 --port 3100",url:"http://127.0.0.1:3100/compte/",reuseExistingServer:!process.env.CI,timeout:120000},
 reporter:process.env.CI?[["list"],["html",{open:"never"}]]:"list"
});
