import {test} from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const profiles=JSON.parse(fs.readFileSync("data/profiles.json","utf8"));
test("V0.2 — profiles strict and unique",()=>{
 assert.equal(profiles.length,4);
 assert.equal(new Set(profiles.map(p=>p.id)).size,profiles.length);
 assert.equal(new Set(profiles.map(p=>p.slug)).size,profiles.length);
 for(const p of profiles){
  assert.match(p.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(p.name&&p.city&&p.headline&&p.description);
  assert.ok(["reseller","care"].includes(p.kind));
  assert.equal(p.demo,true);assert.equal(p.verified,false);
  assert.ok(p.specialties.length>0&&p.services.length>0);
  assert.match(p.name,/démo/i);
 }
});
test("V0.2 — no personal contact data in demonstration dataset",()=>{
 const raw=JSON.stringify(profiles);
 assert.doesNotMatch(raw,/https?:\/\/|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\+33[1-9][0-9]{8}/i);
});
