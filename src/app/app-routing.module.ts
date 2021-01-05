import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainMenuComponent } from './mainmenu/mainmenu.component';
import { LoginComponent } from './company/login/login.component';
import { pricecheckmain } from './inventory/itempricecheck/pricecheckmain';

const routes: Routes = [
  // { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'mainmenu', component: MainMenuComponent },
  { path: 'prc', redirectTo: 'prc', pathMatch: 'full'}, // price check standalone
  { path: 'prc', component: pricecheckmain },
  { path: "**", redirectTo: "login"} // anything invalid
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
