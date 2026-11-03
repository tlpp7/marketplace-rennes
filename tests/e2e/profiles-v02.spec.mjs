import {test,expect} from "@playwright/test";
test.describe("V0.2 — annuaire public et profils de démonstration",()=>{
 test("annuaire, séparation démonstration et absence de faux partenaires",async({page})=>{
  await page.goto("/profils/");
  await expect(page.getByRole("heading",{name:/des personnes qui/i})).toBeVisible();
  await expect(page.getByText("Aperçus fictifs des futurs profils")).toBeVisible();
  await expect(page.getByText("Aucun partenaire validé pour le moment.")).toBeVisible();
  await expect(page.locator(".profile-directory-controls")).toBeVisible();
  await expect(page.locator(".profile-grid .profile-card")).toHaveCount(4);
 });
 test("filtre revendeurs et services",async({page})=>{
  await page.goto("/profils/");
  const search=page.getByRole("searchbox",{name:"Rechercher un profil"});
  const kind=page.getByLabel("Type de profil");
  await kind.selectOption("reseller");
  await expect(page.getByRole("status",{name:""}).last()).toContainText("2 profils");
  await expect(page.locator(".profile-grid .profile-card")).toHaveCount(2);
  await kind.selectOption("care");
  await expect(page.locator(".profile-grid .profile-card")).toHaveCount(2);
  await kind.selectOption("all");
  await search.fill("Photographie");
  await expect(page.locator(".profile-grid .profile-card")).toHaveCount(1);
  await search.fill("rechercheintrouvablev02");
  await expect(page.getByRole("heading",{name:"Aucun résultat"})).toBeVisible();
 });
 test("navigation fiche et retour",async({page})=>{
  await page.goto("/profils/");
  await page.getByRole("link",{name:/Atelier Seconde Vie/i}).click();
  await expect(page).toHaveURL(/\/profils\/atelier-seconde-vie-demo\/?$/);
  await expect(page.getByText("Profil fictif.",{exact:false})).toBeVisible();
  await page.getByRole("link",{name:/Retour aux profils/}).click();
  await expect(page).toHaveURL(/\/profils\/?$/);
 });
 test("profil inconnu = 404",async({page})=>{
  const response=await page.goto("/profils/slug-inexistant-v02/");
  expect(response.status()).toBe(404);
 });
 test("filtre accessible au clavier sur mobile",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/profils/");
  const search=page.getByRole("searchbox",{name:"Rechercher un profil"});
  await search.focus();
  await expect(search).toBeFocused();
  await search.fill("Vintage");
  await expect(page.locator(".profile-grid .profile-card")).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2)).toBe(true);
 });
});
