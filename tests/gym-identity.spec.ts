import {test,expect,type Page} from '@playwright/test';
async function nav(page:Page,name:string){const opener=page.getByRole('button',{name:'Open navigation',exact:true});if(await opener.isVisible())await opener.click();await page.getByRole('navigation',{name:'Owner navigation'}).getByRole('button',{name,exact:true}).click();}
test('gym name is shared between owner settings, member membership and receipts',async({page,context})=>{
 await page.goto('/admin');const initial=await page.request.get('/api/gym-identity');const original=(await initial.json()).name;const member=await context.newPage();
 try{
 await nav(page,'Settings');await page.getByLabel('Studio name').fill('iGYM Test Studio');await page.getByRole('button',{name:'Save settings',exact:true}).click();await expect(page.getByRole('status')).toContainText('Gym name is shared');
 await nav(page,'Memberships');await expect(page.getByText('iGYM Test Studio MEMBERSHIP',{exact:true})).toHaveCount(3);
 await member.goto('http://localhost:3000/');await member.getByRole('button',{name:'Explore the sample journal'}).click();
 const menu=member.getByRole('button',{name:'Open navigation',exact:true});await menu.click();await member.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'My membership',exact:true}).click();
 await expect(member.getByText('Your membership at iGYM Test Studio.',{exact:true})).toBeVisible();await expect(member.getByText('iGYM Test Studio MEMBERSHIP',{exact:true})).toBeVisible();
 await nav(page,'Payments');await page.getByRole('button',{name:'View receipt',exact:true}).first().click();await expect(page.getByRole('dialog',{name:'Invoice & payment'}).locator('.workflow-wordmark')).toHaveText('iGYM Test Studio');
 }finally{await page.request.put('/api/gym-identity',{headers:{Origin:'http://localhost:3001'},data:{name:original}});await member.close();}
});
