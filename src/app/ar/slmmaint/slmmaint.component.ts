import { Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators'
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import { DataService } from '../../services/data.service';
import { SharedService } from '../../services/shared.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import {PcdrFilterPipe} from '../../pipes/pcdrfilter.pipe';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { UserList} from '../../company/list/userlist.component';
import { wjHelperService } from '../../services/wjHelper.service';
import * as wjGrid from "@grapecity/wijmo.grid";

@Component({
	selector: 'app-slmmaint',
	templateUrl: './slmmaint.component.html',
	providers: [DataEntryService],
})
export class SalesmenMaintComponent implements OnDestroy, AfterViewInit {
	fadmin: boolean = false;
    fupdate: boolean = false;
    @ViewChild('g01') salesmanGrid: WjFlexGrid;
	wH: number;
	salesman: DataStore;

	constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, 
		public wjH: wjHelperService, private dialog: MatDialog, public $filter: PcdrFilterPipe) {
	
		this.sharedSrvc.setProgramRights(this, 'slmmaint'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
		this.onResize(null); // Execute at start
		
		this.salesman = this.dESrvc.newDataStore('salesmen', ['fuserid'], true, ['fcid', 'frid']);
		this.dESrvc.validateDataStore('salesmen', 'SALESMEN', 'fcid', 'CUSTOMER');
		this.dESrvc.validateDataStore('salesmen', 'SALESMEN', 'frid', 'DEPARTMENT');
	}

	ngAfterViewInit() {
		this.initGrids();
		this.wjH.fixWM();
		
		this.DataSvc.serverDataGet('api/salesmanMaint/Getlist').subscribe((dataResponse) => {
			this.salesman.loadData(dataResponse);
			this.wjH.gridLoad(this.salesmanGrid, this.salesman.items);
		});

		this.DataSvc.serverDataGet('api/customerMaint/GetListSM').subscribe((dataResponse) => {
			this.salesmanGrid.columns[1].dataMap = new wjGrid.DataMap(dataResponse, 'fcid', 'fname');
		});
		
		this.DataSvc.serverDataGet('api/DepartmentMaint/GetList').subscribe((dataResponse) => {
			this.salesmanGrid.columns[2].dataMap = new wjGrid.DataMap(dataResponse, 'frid', 'fname');
		});
	}

	ngOnDestroy() {
	}

	update() {
		if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
		this.dESrvc.update('api/salesmanMaint/Postupdate')
			.pipe(finalize(()=> this.CompanySvc.ofHourGlass(false)))
			.subscribe();
    }

	add() {
        let dialogRef: MatDialogRef<UserList>;
        dialogRef = this.dialog.open(UserList);
        dialogRef.afterClosed().subscribe((retValue)=> {
            if (retValue) {
                // exit if already exists
                if (this.$filter.transform(this.salesman.items, {fuserid: retValue.FUSERID}, true).length > 0) return;

                this.salesman.addRow({
					fuserid: retValue.FUSERID,
					fname: retValue.FNAME
                });

                this.wjH.gridLoad(this.salesmanGrid, this.salesman.items, false); // Load Data, no refresh
                this.wjH.gridScrollToLastRow(this.salesmanGrid, 1); // Scroll to new row
            }
        });		
	}

	remove() {
		this.wjH.removeGridRow(this.salesmanGrid, this.salesman).subscribe();
	}

	// Resize gridlist to fill window
	onResize(event) {
		setTimeout(() => {
			this.wH = window.innerHeight - 50;
		}, 100);
	};

	initGrids() {
		// wj-flex-grid
        this.salesmanGrid.initialize({
            columns: [
				// {binding: "fuserid", header: "User", width: 250, isReadOnly: true},
				{binding: "fname", header: "User ID", width: 250, isReadOnly: true},
                {binding: "fcid", header: "Customer", width: 350},
				{binding: "frid", header: "Department", width: 300}
            ]
        });
        this.wjH.gridInit(this.salesmanGrid);
	}
}