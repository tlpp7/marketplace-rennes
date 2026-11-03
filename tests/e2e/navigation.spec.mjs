import {test,expect} from "@playwright/test";
test("homepage and catalog",async({page})=>{
 await page.goto("/");
 await expect(page.locator("body")).toContainText("renn", {ignoreCase:true});
 await page.goto("/catalogue/");
 await expect(page.locator("main")).toBeVisible();
});
test("account screen and password recovery",async({page})=>{
 await page.goto("/compte/");
 await expect(page.getByRole("button",{name:"Créer un compte"})).toBeVisible();
 await page.getByRole("button",{name:"Se connecter"}).click();
 await expect(page.getByRole("link",{name:/mot de passe oublié/i})).toBeVisible();
 await page.getByRole("link",{name:/mot de passe oublié/i}).click();
 await expect(page.getByRole("button",{name:/recevoir un lien/i})).toBeVisible();
});
test("anonymous member screen offers login",async({page})=>{
 await page.goto("/mon-espace/");
 await expect(page.getByRole("link",{name:/connexion/i})).toBeVisible();
});
test("mobile navigation does not cause horizontal scrolling",async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto("/");
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
 expect(overflow).toBeFalsy();
});
