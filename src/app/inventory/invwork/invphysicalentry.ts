import { Component, OnDestroy, AfterViewInit, AfterContentInit, ViewChild, Inject, ViewEncapsulation, ElementRef, Input } from '@angular/core';
import { DataService } from '../../services/data.service';
import { CompanyService } from '../../services/company.service';
import { SharedService } from '../../services/shared.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';
import { appHelperService } from '../../services/appHelper.service';
import { DataStore } from '../../services/dataentry.service';
import { MatDialog} from '@angular/material/dialog';
import { ItemRelatedList } from '../../inventory/itemlist/itemrelatedlist.component';

@Component({
    selector: 'invphysicalentry',
    templateUrl: './invphysicalentry.html',
    styleUrls: ['../../inventory/itempricecheck/itempricecheck.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class invphysicalentry implements AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
    @ViewChild('bar03', {static: true}) bar03: pcdrBuilderComponent;
    @ViewChild('fitemE') fitemE: ElementRef;
    @ViewChild('ftenderqty') ftenderqty: ElementRef;
    fitem:string;
    itemCurrent: any = {};
    itemunitsImgCurrent = '';
    tenderqty: string;
    flocation: number;
    companylocations: any[];
    invwork:DataStore;

    constructor(private CompanySvc: CompanyService, private DataSvc: DataService, public wjH: wjHelperService, 
        public appH: appHelperService, public dialog: MatDialog) {
            // Get Company Locations for DropDown
            DataSvc.serverDataGet('api/CompanyMaint/GetLocationsDD').subscribe((dataResponse) => {
                this.companylocations = dataResponse;
                // this.companylocations.unshift({fcmpid: 1, fcmplid: 0, fname: "All"}); // Add first item
                this.flocation = this.appH.getUserLocation(); // Assign user location
            });
        }

    ngAfterViewInit() {
        this.focusToScan();
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Location', 
        })
        this.bar02.setNavProperties(this, {
            title: 'Item', 
            buttons: [
                {name: 'Clear Form', style: 'light', action: 'clearForm'},
                {name: 'Item Options', style: 'primary', action: 'itemOptions'}
            ],
        })
        this.bar03.setNavProperties(this, {
            title: 'Quantity', 
        })
    }

    // barXX Events
    onClickNav(parm) {
        this[parm.action](parm.val);
    }

    onKeypadValueChange(event) {
        this.tenderqty = event;
        if (this.tenderqty == '') this.focusToQty(); // Clear was pressed
    }

    onEnter() {
        this.tenderqty = this.CompanySvc.validNumber(this.tenderqty); // Will make it at least 0
        if (this.tenderqty <= '0') {
            this.appH.toastr('Quantity Must Be Greater Than Zero!', 'error', '', true);
            this.focusToQty();
            return;
        }
        
        this.CompanySvc.ofHourGlass(true);
        // Create invwork
        let data = [['invworksinsert', [{
            fitem: this.itemCurrent.fitem,
            ftype: 'AP', // Physical Inventory
            fstatus: 'O', // Open
            fuser: this.appH.getUsername(),                
            flocation: this.flocation,            
            fqty: this.tenderqty
            // fiwid: -1, // Server will update
            // ts: dt, // Server will update
            // fdate: dt, // Server will update
        }]]];
        // post
        this.DataSvc.serverDataPost('api/Invwork/Postinvwork', data).subscribe((dataResponse) => {
            this.CompanySvc.ofHourGlass(false);
            // console.log(dataResponse);
            if (dataResponse.success) {
                this.appH.toastr('Data Posted', 'success');
                this.clearForm();
            }
        });
    }

    validEntry() {
        return (this.itemCurrent.hasOwnProperty('fitem'));
    }

    // Show related items and replace if not isNew()
    itemOptions() {
        if (!this.validEntry()) { this.focusToScan(); return };

        let row = this.itemCurrent;
        let pData = { fitem: row.fitem, fcid: 0 };
        this.dialog.open(ItemRelatedList, {data: pData}).afterClosed().subscribe(selected => {
            if (!selected) { this.focusToScan(); return };
            
            // Make sure is different
            if (row.fitem !== selected.fitem) {
                row.fitem = selected.fitem;
                row.fdescription = selected.fdescription;
                row.fuomdescription = selected.fuomdescription;
                row.funits = selected.funits;
            }
            this.setImage(this.itemCurrent);
            this.focusToQty();
        });
    }
    

    fitemOnChange() {
        if (!this.fitem || this.fitem.length < 2) return;

        this.DataSvc.serverDataGet('api/ItemMaint/GetValidateItem', {pfitem: this.fitem}).subscribe((dataResponse) => {
            if (dataResponse.length == 0) {
                this.appH.toastr('Item ' + this.fitem + ' not found!','error', '', true);
                this.clearForm(); // Clears this.fitem
                this.focusToScan();
                return;
            }
            else {
                this.itemCurrent = dataResponse[0];
                this.setImage(this.itemCurrent);
            }

            this.fitem = ''; // Clear value
            this.focusToQty();
        });
    }

    setImage(row) {
        this.itemunitsImgCurrent = (row) ? './images/' + row.fitem + '.jpg' : '';
    }

    focusToScan() {
        setTimeout(() => {
            this.fitemE.nativeElement.focus();
            this.fitemE.nativeElement.select();
        }, 100);
    }
    
    focusToQty() {
        setTimeout(() => {
            this.ftenderqty.nativeElement.focus();
            this.ftenderqty.nativeElement.select();
        }, 100);
    }

    clearForm() {
        this.fitem = ''; // Clear value
        this.tenderqty = ''; // Clear value
        this.itemCurrent = {};
        this.focusToScan();
        this.setImage(null);
    }
}