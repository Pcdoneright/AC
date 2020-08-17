import { Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators'
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import { DataService } from '../../services/data.service';
import { SharedService } from '../../services/shared.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';

@Component({
	selector: 'app-depmaint',
	templateUrl: './depmaint.component.html',
	providers: [DataEntryService],
})
export class DepartmentMaintComponent implements OnDestroy, AfterViewInit {
	fadmin: boolean = false;
    fupdate: boolean = false;
    @ViewChild('g01') departmentGrid: WjFlexGrid;
	wH: number;
	representative: DataStore;

	constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, 
		public wjH: wjHelperService) {
	
		this.sharedSrvc.setProgramRights(this, 'departments'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
		this.onResize(null); // Execute at start
		
		this.representative = this.dESrvc.newDataStore('representatives', ['frid'], true, ['frid', 'fname']);
		this.dESrvc.validateDataStore('representatives', 'DEPARTMENT', 'fname', 'NAME');
	}

	ngAfterViewInit() {
		this.initGrids();
		this.wjH.fixWM();
		
		this.DataSvc.serverDataGet('api/DepartmentMaint/GetList').subscribe((dataResponse) => {
			this.representative.loadData(dataResponse);
			this.wjH.gridLoad(this.departmentGrid, this.representative.items);
		});
	}

	ngOnDestroy() {
	}

	update() {
		if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
		this.dESrvc.update('api/DepartmentMaint/Postupdate')
			.pipe(finalize(()=> this.CompanySvc.ofHourGlass(false)))
			.subscribe();
    }

	add() {
		this.representative.addRow({
			frid: this.dESrvc.getMaxValue(this.representative.items, 'frid') + 1,
		});

		this.wjH.gridLoad(this.departmentGrid, this.representative.items, false); // Load Data, no refresh
		this.wjH.gridScrollToLastRow(this.departmentGrid, 1); // Scroll to new row
	}

	remove() {
		this.wjH.removeGridRow(this.departmentGrid, this.representative).subscribe();
	}

	// Resize gridlist to fill window
	onResize(event) {
		setTimeout(() => {
			this.wH = window.innerHeight - 50;
		}, 100);
	};

	initGrids() {
		// wj-flex-grid
        this.departmentGrid.initialize({
            columns: [
				// {binding: "fuserid", header: "User", width: 250, isReadOnly: true},
				{binding: "frid", header: "ID", width: 90, isReadOnly: true},
                {binding: "fname", header: "Name", width: 350}
            ]
        });
        this.wjH.gridInit(this.departmentGrid);
	}
}