import { LogComponent } from './company/log/log.component';
import { CodeMaintComponent } from './company/codemaintenance/codemaint.component';
import { ProgMaintComponent } from './company/programrightsmaint/programmaint.component';
import { DepartmentMaintComponent } from './company/depmaint/depmaint.component';
import { companymaint } from './company/companymaint/companymaint';
import { usermaint } from './company/usermaint/usermaint';
import { CustmaintComponent } from './ar/custmaint/custmaint.component';
import { SoentryComponent } from './ar/soentry/soentry.component';
import { SoRegisterComponent } from './ar/soentry/soregister.component';
import { soonline } from './ar/soentry/soonline';
import { sovendor } from './ar/soentry/sovendor';
import { SlminvntryComponent } from './ar/slminvntry/slminvntry.component';
import { crdrawersmaint } from './ar/crdrawersmaint/crdrawersmaint';
import { customersalesbyitemComponent } from './ar/reports/customersalesbyitem/customersalesbyitem.component';
import { salesagingrpt } from './ar/reports/salesagingrpt/salesagingrpt';
import { salesordersrpt } from './ar/reports/salesordersrpt/salesordersrpt';
import { pricediscrepancyrpt } from './ar/reports/pricediscrepancyrpt/pricediscrepancyrpt';
import { cashregistersales } from './ar/reports/cashregistersales/cashregistersales';
import { SalesmenMaintComponent } from './ar/slmmaint/slmmaint.component';
import { soreopeninvoice } from './ar/soreopeninvoice/soreopeninvoice';
import { taxrates } from './ar/taxrates/taxrates';
import { PoentryComponent } from './ap/poentry/poentry.component';
import { PoreceiveComponent } from './ap/poreceive/poreceive.component';
import { AppaymentsComponent } from './ap/payments/appayments.component';
import { VendormaintComponent } from './ap/vendormaint/vendormaint.component';
import { TimeclockComponent } from './pr/timeclock/timeclock.component';
import { HoursRptComponent } from './pr/hoursrpt/hoursrpt.component';
import { PayperiodComponent } from './pr/payperiod/payperiod.component';
import { EmpMaintComponent } from './pr/empmaint/empmaint.component';
import { itemmaintComponent } from './inventory/itemmaint/itemmaint.component';
import { itemmovement } from './inventory/reports/itemmovement/itemmovement';
import { itemsalesrpt } from './inventory/reports/itemsalesrpt/itemsalesrpt';
import { invtrxbyitemrpt } from './inventory/reports/invtrxbyitemrpt/invtrxbyitemrpt';
import { invdiscrepancy } from './inventory/reports/invdiscrepancy/invdiscrepancy';
import { invworkreport } from './inventory/reports/invworkreport/invworkreport';
import { invworkxdscrpc } from './inventory/reports/invworkxdscrpc/invworkxdscrpc';
import { invvaluation } from './inventory/reports/invvaluation/invvaluation';
import { invonhand } from './inventory/reports/invvaluation/invonhand';
import { inventorysalesmovementComponent } from './inventory/reports/inventorysalesmovement/inventorysalesmovement.component';
import { itemreassign } from './inventory/itemreassign/itemreassign';
import { invadjustment } from './inventory/invwork/invadjustment';
import { invtransferout } from './inventory/invwork/invtransferout';
import { invtransferreq } from './inventory/invwork/invtransferreq';
import { invtransferprod } from './inventory/invwork/invtransferprod';
import { invtransfertoinv } from './inventory/invwork/invtransfertoinv';
import { invtransferin } from './inventory/invwork/invtransferin';
import { invphysicalentry } from './inventory/invwork/invphysicalentry';
import { invphysicalpost } from './inventory/invwork/invphysicalpost';
import { invtransfertosaleman } from './inventory/invwork//invtransfertosaleman';
import { dashboarditem } from './inventory/dashboarditem/dashboarditem';
import { Injectable } from "@angular/core";

@Injectable()
export class CustomModule {
    ofGetComponent(compName:string) :any {
        switch (compName) {
            case "changelog":
                return LogComponent;
            case "timeclock":
                return TimeclockComponent;
            case "hoursrpt":
                return HoursRptComponent;
            case "payperiod":
                return PayperiodComponent;
            case "empmaint":
                return EmpMaintComponent;
            case 'itemmaintenance':
                return itemmaintComponent;
            case 'cust_maint':
                return CustmaintComponent;
            case 'vendor_maint':
                return VendormaintComponent;
            case 'soentry':
                return SoentryComponent;
            case 'soentrytouch':
                return SoRegisterComponent;
            case 'poentry':
                return PoentryComponent;
            case 'poreceive':
                return PoreceiveComponent;
            case 'codemaintenance':
                return CodeMaintComponent;
            case 'programrights':
                return ProgMaintComponent;
            case 'appayments':
                return AppaymentsComponent;
            case 'slmmaint':
                return SalesmenMaintComponent;
            case 'departments':
                return DepartmentMaintComponent;
            case 'slminvntry':
                return SlminvntryComponent;
            case 'customersalesbyitem':
                return customersalesbyitemComponent;
            case 'inventorysalesmovement':
                return inventorysalesmovementComponent;
            case 'salesagingrpt':
                return salesagingrpt;
            case 'salesordersrpt':
                return salesordersrpt;
            case 'soreopeninvoice':
                return soreopeninvoice;
            case 'cashregistersales':
                return cashregistersales;
            case 'itemmovement':
                return itemmovement;
            case 'itemsalesrpt':
                return itemsalesrpt;
            case 'companymaint':
                return companymaint;
            case 'itemreassign':
                return itemreassign;
            case 'crdrawersmaint':
                return crdrawersmaint;
            case 'invadjustment':
                return invadjustment;
            case 'invtransferout':
                return invtransferout;
            case 'invtransferreq':
                return invtransferreq;
            case 'invtransferprod':
                return invtransferprod;
            case 'invtransfertoinv':
                return invtransfertoinv;
            case 'invtransferin':
                return invtransferin;
            case 'invphysicalentry':
                return invphysicalentry;
            case 'invphysicalpost':
                return invphysicalpost;
            case 'invdiscrepancy':
                return invdiscrepancy;
            case 'invworkreport':
                return invworkreport;
            case 'invworkxdscrpc':
                return invworkxdscrpc;
            case 'usermaint':
                return usermaint;
            case 'soonline':
                return soonline;
            case 'taxrates':
                return taxrates;
            case 'invvaluation':
                return invvaluation;
            case 'invonhand':
                return invonhand;
            case 'dashboarditem':
                return dashboarditem;
            case 'sovendor':
                return sovendor;
            case 'invtransfertosaleman':
                return invtransfertosaleman;
            case 'pricediscrepancyrpt':
                return pricediscrepancyrpt;
            case 'invtrxbyitemrpt':
                return invtrxbyitemrpt;
        }
        return '';
    }
}