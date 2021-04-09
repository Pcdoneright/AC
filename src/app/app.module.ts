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
import { appHelperService } from './services/appHelper.service';
import { CompanyService } from './services/company.service';
import { ConfirmDialog } from './services/confirm-dialog.component';
import { InputDialog } from './services/dialog-input.component';
import { CompanyRulesService } from './services/companyrules.service';
import { pcdrBuilderComponent } from './services/builder/builder.component';
import { KeyPadComponent } from "./services/keypad.component"
import { cloverService } from "./services/clover.service"
import { ListPrograms } from './lists/list-programs.component';

//Company
import { LoginComponent } from './company/login/login.component';
import { UserList} from './company/list/userlist.component';
import { LogComponent } from './company/log/log.component';
import { CodeMaintComponent } from './company/codemaintenance/codemaint.component';
import { ProgMaintComponent } from './company/programrightsmaint/programmaint.component';
import { DepartmentMaintComponent } from './company/depmaint/depmaint.component';
import { companymaint } from './company/companymaint/companymaint';
import { usermaint } from './company/usermaint/usermaint';
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
import { soonline } from './ar/soentry/soonline';
import { sovendor } from './ar/soentry/sovendor';
import { SlminvntryComponent } from './ar/slminvntry/slminvntry.component';
import { customersalesbyitemComponent } from './ar/reports/customersalesbyitem/customersalesbyitem.component';
import { SalesmenMaintComponent } from './ar/slmmaint/slmmaint.component';
import { salesagingrpt } from './ar/reports/salesagingrpt/salesagingrpt';
import { salesordersrpt } from './ar/reports/salesordersrpt/salesordersrpt';
import { pricediscrepancyrpt } from './ar/reports/pricediscrepancyrpt/pricediscrepancyrpt';
import { soreopeninvoice } from './ar/soreopeninvoice/soreopeninvoice';
import { cashregistersales } from './ar/reports/cashregistersales/cashregistersales';
import { soProperties } from './ar/components/soproperties';
import { crdrawersmaint } from './ar/crdrawersmaint/crdrawersmaint';
import { taxrates } from './ar/taxrates/taxrates';

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
import { invwork } from './inventory/invwork/invwork';
import { invadjustment } from './inventory/invwork/invadjustment';
import { invtransferout } from './inventory/invwork/invtransferout';
import { invtransferreq } from './inventory/invwork/invtransferreq';
import { invtransferprod } from './inventory/invwork/invtransferprod';
import { invtransfertoinv } from './inventory/invwork/invtransfertoinv';
import { invtransferin } from './inventory/invwork/invtransferin';
import { invphysicalentry } from './inventory/invwork/invphysicalentry';
import { invphysicalpost } from './inventory/invwork/invphysicalpost';
import { invtransfertosaleman } from './inventory/invwork//invtransfertosaleman';
import { inventorysalesmovementComponent } from './inventory/reports/inventorysalesmovement/inventorysalesmovement.component';
import { Itemvendorcost } from './inventory/itemlist/itemvendorcost.component';
import { Itempurchasehist } from './ap/list/itempurchasehist.component';
import { itemmovement } from './inventory/reports/itemmovement/itemmovement';
import { itemsalesrpt } from './inventory/reports/itemsalesrpt/itemsalesrpt';
import { invtrxbyitemrpt } from './inventory/reports/invtrxbyitemrpt/invtrxbyitemrpt';
import { invdiscrepancy } from './inventory/reports/invdiscrepancy/invdiscrepancy';
import { invworkreport } from './inventory/reports/invworkreport/invworkreport';
import { invworkxdscrpc } from './inventory/reports/invworkxdscrpc/invworkxdscrpc';
import { invvaluation } from './inventory/reports/invvaluation/invvaluation';
import { invonhand } from './inventory/reports/invvaluation/invonhand';
import { transferitemlist } from './inventory/itemlist/transferitemlist';
import { dashboarditem } from './inventory/dashboarditem/dashboarditem';

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
    transferitemlist,
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
    pricediscrepancyrpt,
    soreopeninvoice,
    cashregistersales,
    soProperties,
    itemmovement,
    itemsalesrpt,
    invtrxbyitemrpt,
    companymaint,
    itemreassign,
    pricecheckmain,
    crdrawersmaint,
    invwork,
    invadjustment,
    usermaint,
    invtransferout,
    invtransferreq,
    invtransferprod,
    invtransfertoinv,
    invtransferin,
    invphysicalentry,
    invphysicalpost,
    invdiscrepancy,
    invworkreport,
    invworkxdscrpc,
    soonline,
    sovendor,
    taxrates,
    invvaluation,
    invonhand,
    invtransfertosaleman,
    dashboarditem
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
    appHelperService,
    CompanyService,
    CompanyRulesService,
    cloverService
  ],
  // entryComponents: [
  //   MenUtillitiesComponent,
  //   ItemPriceCheck,
  //   ConfirmDialog,
  //   InputDialog,
  //   CustmaintComponent,
  //   ItemList,
  //   SoentryComponent,
  //   itemmaintComponent,
  //   DialogItemNumber,
  //   ViewCustomerPricing,
  //   CustItemList,
  //   CustItemHistoryList,
  //   ItemRelatedList,
  //   SoRegisterComponent,
  //   SOEditItem,
  //   CustomerList,
  //   transferitemlist,
  //   SoPayment,
  //   SOViewCustomer,
  //   SlminvntryComponent,
  //   customersalesbyitemComponent,
  //   SalesmenMaintComponent,
  //   UserList,
  //   inventorysalesmovementComponent,
  //   PoentryComponent,
  //   PoreceiveComponent,
  //   AppaymentsComponent,
  //   VendItemList,
  //   Itemvendorcost,
  //   Itempurchasehist,
  //   PoPayment,
  //   LogComponent,
  //   CodeMaintComponent,
  //   ProgMaintComponent,
  //   DepartmentMaintComponent,
  //   ListPrograms,
  //   TimeclockComponent,
  //   HoursRptComponent,
  //   PayperiodComponent,
  //   EmpMaintComponent,
  //   ViewHours,
  //   QuickcallingComponent,
  //   DailybreakdownComponent,
  //   VendormaintComponent,
  //   salesagingrpt,
  //   salesordersrpt,
  //   pricediscrepancyrpt,
  //   soreopeninvoice,
  //   cashregistersales,
  //   itemmovement,
  //   itemsalesrpt,
  //   invtrxbyitemrpt,
  //   companymaint,
  //   itemreassign,
  //   pricecheckmain,
  //   crdrawersmaint,
  //   invadjustment,
  //   usermaint,
  //   invtransferout,
  //   invtransferreq,
  //   invtransferprod,
  //   invtransfertoinv,
  //   invtransferin,
  //   invphysicalentry,
  //   invphysicalpost,
  //   invdiscrepancy,
  //   invworkreport,
  //   invworkxdscrpc,
  //   soonline,
  //   sovendor,
  //   taxrates,
  //   invvaluation,
  //   invonhand,
  //   invtransfertosaleman,
  //   dashboarditem
  // ],
  bootstrap: [AppComponent]
})
export class AppModule { }
