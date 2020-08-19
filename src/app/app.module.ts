import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Xtra
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';

// External Utilities
import { NgPipesModule } from 'ngx-pipes';
import { ToastrModule } from 'ngx-toastr';
import { MatTabsModule} from '@angular/material/tabs';
import { MatCheckboxModule} from '@angular/material/checkbox';
import { MatDialogModule} from '@angular/material/dialog';
import { MatRadioModule} from '@angular/material/radio';
import { MatTooltipModule} from '@angular/material/tooltip';
import { MatSidenavModule} from '@angular/material/sidenav';
import { MatSlideToggleModule} from '@angular/material/slide-toggle';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularSplitModule } from 'angular-split';
import { WjGridModule } from '@grapecity/wijmo.angular2.grid';
import { WjInputModule } from '@grapecity/wijmo.angular2.input';

// Application
import { SharedService } from './services/shared.service';
import { CustomModule } from './appcustom.module';
import { PcdrFilterPipe } from './pipes/pcdrfilter.pipe';
import { DataService } from './services/data.service';
import { CompanyVersion } from './services/companyversion';
import { MainMenuComponent } from './mainmenu/mainmenu.component';
import { MenUtillitiesComponent } from "./services/menutillities.component";
import { ItemPriceCheck } from './inventory/itempricecheck/itempricecheck.component';
import { pricecheckmain } from './inventory/itempricecheck/pricecheckmain';
import { wjHelperService } from './services/wjHelper.service';
import { CompanyService } from './services/company.service';
import { ConfirmDialog } from './services/confirm-dialog.component';
import { InputDialog } from './services/dialog-input.component';
import { CompanyRulesService } from './services/companyrules.service';
import { pcdrBuilderComponent } from './services/builder/builder.component';
import { KeyPadComponent } from "./services/keypad.component"
import { ListPrograms } from './lists/list-programs.component';

//Company
import { LoginComponent } from './company/login/login.component';
import { UserList} from './company/list/userlist.component';
import { LogComponent } from './company/log/log.component';
import { CodeMaintComponent } from './company/codemaintenance/codemaint.component';
import { ProgMaintComponent } from './company/programrightsmaint/programmaint.component';
import { DepartmentMaintComponent } from './company/depmaint/depmaint.component';
import { companymaint } from './company/companymaint/companymaint';
// import { PcdrDirectiveDirective } from './company/companymaint/companymaint';

//AR
import { CustmaintComponent } from './ar/custmaint/custmaint.component';
import { SoentryComponent } from './ar/soentry/soentry.component';
import { CustItemList } from './ar/list/custitemlist.component';
import { CustItemHistoryList } from './ar/list/custitemhistorylist.component';
import { CustomerList } from './ar/list/custlist.component';
import { SoPayment } from './ar/soentry/sopayment.component';
import { SoRegisterComponent, SOEditItem } from './ar/soentry/soregister.component';
import { SOViewCustomer } from './ar/soentry/soregisterorder.component';
import { SlminvntryComponent } from './ar/slminvntry/slminvntry.component';
import { customersalesbyitemComponent } from './ar/reports/customersalesbyitem/customersalesbyitem.component';
import { SalesmenMaintComponent } from './ar/slmmaint/slmmaint.component';
import { salesagingrpt } from './ar/reports/salesagingrpt/salesagingrpt';
import { salesordersrpt } from './ar/reports/salesordersrpt/salesordersrpt';
import { soreopeninvoice } from './ar/soreopeninvoice/soreopeninvoice';
import { cashregistersales } from './ar/reports/cashregistersales/cashregistersales';
import { soProperties } from './ar/components/soproperties';

//AP
import { PoentryComponent } from './ap/poentry/poentry.component';
import { PoreceiveComponent } from './ap/poreceive/poreceive.component';
import { AppaymentsComponent } from './ap/payments/appayments.component';
import { VendItemList } from './ap/list/vendoritemlist.component';
import { PoPayment } from './ap/poentry/popayment.component';
import { VendormaintComponent } from './ap/vendormaint/vendormaint.component';

//INV
import { ItemList } from './inventory/itemlist/itemlist.component';
import { itemmaintComponent, DialogItemNumber, ViewCustomerPricing } from './inventory/itemmaint/itemmaint.component';
import { itemreassign } from './inventory/itemreassign/itemreassign';
import { ItemRelatedList } from './inventory/itemlist/itemrelatedlist.component';
import { inventorysalesmovementComponent } from './inventory/reports/inventorysalesmovement/inventorysalesmovement.component';
import { Itemvendorcost } from './inventory/itemlist/itemvendorcost.component';
import { Itempurchasehist } from './ap/list/itempurchasehist.component';
import { itemmovement } from './inventory/reports/itemmovement/itemmovement';
import { itemsalesrpt } from './inventory/reports/itemsalesrpt/itemsalesrpt';

//PR
import { TimeclockComponent } from './pr/timeclock/timeclock.component';
import { HoursRptComponent } from './pr/hoursrpt/hoursrpt.component';
import { PayperiodComponent } from './pr/payperiod/payperiod.component';
import { EmpMaintComponent } from './pr/empmaint/empmaint.component';
import { ViewHours } from './pr/timeclock/viewHours.component';

//Reports
import { QuickcallingComponent } from './reports/quickcalling/quickcalling.component';
import { DailybreakdownComponent } from './reports/dailybreakdown/dailybreakdown.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PcdrFilterPipe,
    MainMenuComponent,
    MenUtillitiesComponent,
    ItemPriceCheck,
    ConfirmDialog,
    InputDialog,
    CustmaintComponent,
    ItemList,
    pcdrBuilderComponent,
    SoentryComponent,
    itemmaintComponent,
    DialogItemNumber,
    ViewCustomerPricing,
    CustItemList,
    CustItemHistoryList,
    ItemRelatedList,
    SoRegisterComponent,
    SOEditItem,
    CustomerList,
    SoPayment,
    SOViewCustomer,
    KeyPadComponent,
    SlminvntryComponent,
    customersalesbyitemComponent,
    SalesmenMaintComponent,
    UserList,
    inventorysalesmovementComponent,
    PoentryComponent,
    PoreceiveComponent,
    AppaymentsComponent,
    VendItemList,
    Itemvendorcost,
    Itempurchasehist,
    PoPayment,
    LogComponent,
    CodeMaintComponent,
    ProgMaintComponent,
    DepartmentMaintComponent,
    ListPrograms,
    TimeclockComponent,
    HoursRptComponent,
    PayperiodComponent,
    EmpMaintComponent,
    ViewHours,
    QuickcallingComponent,
    DailybreakdownComponent,
    VendormaintComponent,
    salesagingrpt,
    salesordersrpt,
    soreopeninvoice,
    cashregistersales,
    soProperties,
    itemmovement,
    itemsalesrpt,
    companymaint,
    itemreassign,
    pricecheckmain
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot({ positionClass: 'toast-bottom-right' }),
    MatCheckboxModule,
    MatRadioModule,
    MatTabsModule,
    MatDialogModule,
    MatTooltipModule,
    MatSidenavModule,
    MatSlideToggleModule,
    FlexLayoutModule,
    AngularSplitModule.forRoot(),
    WjGridModule,
    WjInputModule,
    NgPipesModule,
    DragDropModule
  ],
  providers: [
    DatePipe,
    CurrencyPipe,
    SharedService,
    CustomModule,
    DataService,
    PcdrFilterPipe,
    CompanyVersion,
    wjHelperService,
    CompanyService,
    CompanyRulesService
  ],
  entryComponents: [
    MenUtillitiesComponent,
    ItemPriceCheck,
    ConfirmDialog,
    InputDialog,
    CustmaintComponent,
    ItemList,
    SoentryComponent,
    itemmaintComponent,
    DialogItemNumber,
    ViewCustomerPricing,
    CustItemList,
    CustItemHistoryList,
    ItemRelatedList,
    SoRegisterComponent,
    SOEditItem,
    CustomerList,
    SoPayment,
    SOViewCustomer,
    KeyPadComponent,
    SlminvntryComponent,
    customersalesbyitemComponent,
    SalesmenMaintComponent,
    UserList,
    inventorysalesmovementComponent,
    PoentryComponent,
    PoreceiveComponent,
    AppaymentsComponent,
    VendItemList,
    Itemvendorcost,
    Itempurchasehist,
    PoPayment,
    LogComponent,
    CodeMaintComponent,
    ProgMaintComponent,
    DepartmentMaintComponent,
    ListPrograms,
    TimeclockComponent,
    HoursRptComponent,
    PayperiodComponent,
    EmpMaintComponent,
    ViewHours,
    QuickcallingComponent,
    DailybreakdownComponent,
    VendormaintComponent,
    salesagingrpt,
    salesordersrpt,
    soreopeninvoice,
    cashregistersales,
    itemmovement,
    itemsalesrpt,
    companymaint,
    itemreassign,
    pricecheckmain
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
