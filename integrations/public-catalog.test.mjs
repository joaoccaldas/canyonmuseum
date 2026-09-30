import assert from "node:assert/strict";
import fs from "node:fs";
import {
  listProducts, getProduct, listEvents, getEvent,
  listEventPlaces, getPlace, getPublicCatalogMeta
} from "../integrations/public-catalog.mjs";

const meta=getPublicCatalogMeta();
assert.equal(meta.schema_version,1);
assert.equal(meta.privacy.contains_user_state,false);
assert.equal(meta.privacy.contains_accounts,false);
assert.equal(meta.privacy.remote_writes,false);
assert.ok(meta.counts.products >= 40);
assert.ok(meta.counts.places >= 5);
assert.equal(meta.counts.events,1);

const bikes=listProducts({type:"bike"});
assert.ok(bikes.length > 0);
assert.ok(bikes.every(p => p.object_type === "product" && p.product_type === "bike"));
assert.ok(bikes.every(p => Array.isArray(p.capabilities)));
assert.ok(bikes.every(p => !("facts" in p)), "public adapter must not leak unnecessary source payload");

const canyon=listProducts({brand:"Canyon"});
assert.ok(canyon.length > 0);
const cfr=getProduct("canyon-cfr-2027");
assert.ok(cfr);
assert.equal(cfr.brand,"Canyon");
assert.ok(cfr.capabilities.includes("customize"));
assert.ok(cfr.capabilities.includes("equip"));

assert.equal(getProduct("../../etc/passwd"),null);
assert.equal(getEvent("kona-2026")?.id,"kona-2026");
assert.equal(listEvents().length,1);
assert.ok(listEventPlaces("kona-2026").length >= 5);
assert.ok(listEventPlaces("kona-2026",{category:"culture"}).length >= 1);
assert.equal(listEventPlaces("other-event").length,0);
assert.equal(getPlace("kailua-pier")?.object_type,"place");

const raw=fs.readFileSync(new URL("../integrations/public-catalog.json", import.meta.url),"utf8");
for (const forbidden of ["@gmail.com","password","secret_key","private_key","access_token","refresh_token"]) {
  assert.equal(raw.toLowerCase().includes(forbidden),false,`forbidden public-catalog token: ${forbidden}`);
}

console.log("Public catalog adapter PASS");
