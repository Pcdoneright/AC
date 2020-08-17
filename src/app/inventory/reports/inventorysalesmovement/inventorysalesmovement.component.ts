import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef} from '@angular/core';
import { DataService } from '../../../services/data.service';
import { DataEntryService, DataStore } from '../../../services/dataentry.service';
import { CompanyService } from '../../../services/company.service';
import { wjHelperService } from '../../../services/wjHelper.service';
import { DatePipe } from '@angular/common';
import { PcdrFilterPipe } from '../../../pipes/pcdrfilter.pipe';
import { pcdrBuilderComponent } from '../../../services/builder/builder.component';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjGridFilter from "@grapecity/wijmo.grid.filter";
import { FormControl } from "@angular/forms";
import { ToastrService } from 'ngx-toastr';
import { ItemList } from '../../../inventory/itemlist/itemlist.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'inventorysalesmovement',
    templateUrl: './inventorysalesmovement.component.html',
    providers: [DataEntryService] // New instance gets created
})
export class inventorysalesmovementComponent implements OnDestroy, AfterViewInit {
    fdatef = new Date();
    fdatet = new Date();
    fexcel = '0';
    fsubcategory: any;
    fctid = 'All';
    fsctid = 'All';
    fcategory: any;
    forder = "cmovement";
    freport = "S";

    fitem:string;
    fdescription = '';
    
    constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, public wjH: wjHelperService, private datePipe: DatePipe, private toastr: ToastrService, 
        private $filter: PcdrFilterPipe, public dialog: MatDialog) {
        this.dESrvc.initCodeTable().subscribe((dataResponse) => {
            this.fcategory = this.$filter.transform(dataResponse, {fgroupid: 'IMC'}, true);
            this.fcategory.unshift({fgroupid: 'IMC', fid: 'All'}); // Add ALL
            this.fsubcategory = this.$filter.transform(dataResponse, {fgroupid: 'IMSC'}, true);
            this.fsubcategory.unshift({fgroupid: 'IMSC', fid: 'All'}); // Add ALL
        }); // when codetable is needed
    }

    ngOnInit() {}

    ngOnDestroy() {}

    ngAfterViewInit() {
        this.wjH.fixWM()
    }

    // Add scanned item
    fitemOnChange() {
        this.fdescription = '';
        if (!this.fitem) return;
        if (this.fitem.length < 3) return false;

        this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItem', {pfitem: this.fitem}).subscribe((dataResponse) => {
            if (dataResponse.length == 0) {
                this.toastr.error('Item not found!','', {positionClass: 'toast-bottom-full-width', progressBar: true, progressAnimation: 'increasing'});
                return;
            }
            this.fdescription = dataResponse[0].fdescription + ' ' + dataResponse[0].fuomdescription;
        });
    }

    lookupitem() {
        this.dialog.open(ItemList, {data: {fcid: '-1'}}).afterClosed().subscribe(selected => {
            if (!selected) return;
            this.fitem = selected.fitem;
            this.fdescription = selected.fdescription + ' ' + selected.fuomdescription;
        });
    }

    print() {
        var mParms = 
            "&pdatef=" + this.datePipe.transform(this.fdatef, 'yyyy-MM-dd') + 
            "&pdatet=" + this.datePipe.transform(this.fdatet, 'yyyy-MM-dd') +
            "&psort=" + this.forder.toString() +
            "&pexport=" + this.fexcel.toString() +
            "&pwhere=" + (this.fitem? " AND apc.itemunits.fitem ='" + this.fitem + "'": "") +
            (this.fctid != 'All'? " AND itemmasters.fcategory='" + this.fctid + "'": '') +
            (this.fsctid != 'All'? " AND itemmasters.fsubcategory='" + this.fsctid + "'": '')
        this.CompanySvc.ofHourGlass(true);
        this.CompanySvc.ofCreateJasperReport('inventorysalesmovement.' + (this.fexcel == '1'? 'xlsx': 'pdf'), mParms).subscribe((pResponse) => {
            // Open PDF or XLXS file
            setTimeout(() => {
                this.CompanySvc.ofOpenServerFile(pResponse.data);
            }, 1000);
        });
    }
}