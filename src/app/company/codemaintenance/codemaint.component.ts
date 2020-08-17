import { Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators'
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import { DataService } from '../../services/data.service';
import { SharedService } from '../../services/shared.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { PcdrFilterPipe } from '../../pipes/pcdrfilter.pipe';

@Component({
	selector: 'app-codemaint',
	templateUrl: './codemaint.component.html',
	providers: [DataEntryService],
})
export class CodeMaintComponent implements OnDestroy, AfterViewInit {
	// $filter: PcdrFilterPipe  = new PcdrFilterPipe();
	@ViewChild('cdmGrid01') cdmGrid01: WjFlexGrid;
    @ViewChild('cdmGrid02') cdmGrid02: WjFlexGrid;
	wH: number;
	codedetail: DataStore;

	constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, 
		public wjH: wjHelperService, public $filter: PcdrFilterPipe ) {
	
		this.sharedSrvc.setProgramRights(this, 'codemaintenance'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
		this.onResize(null); // Execute at start
		
		this.codedetail = this.dESrvc.newDataStore('code_detail', ['fgroupid', 'fid'], true, ['fid']);
		this.dESrvc.validateDataStore('code_detail', 'DETAILS', 'fid', 'ID');
	}

	ngAfterViewInit() {
		this.initGrids();
		this.wjH.fixWM();	
		
		this.DataSvc.serverDataGet('api/CodeMaint/GetCode').subscribe((dataResponse) => {
			this.wjH.gridLoad(this.cdmGrid01, dataResponse.code_master, false);
			this.codedetail.loadData(dataResponse.code_detail);
		});
	}

	ngOnDestroy() {
	}

	update() {
		if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
		this.dESrvc.update('api/CodeMaint/Postupdate')
			.pipe(finalize(()=> this.CompanySvc.ofHourGlass(false)))
			.subscribe();
    }

	codedetailFilter(pfgroupid) :any[] {
		return this.$filter.transform(this.codedetail.items, { fgroupid: pfgroupid }, true);
	}

	codeAdd() {
		// Get selected parent row if any
		var row = this.wjH.getGridSelectecRow(this.cdmGrid01);
		if (!row) return;

		this.CompanySvc.inputDialog('Detail ID').subscribe((value) => {
			if (value) {
				this.codedetail.addRow({
					fgroupid: row.fgroupid,
					fid: value
				});
				this.wjH.gridLoad(this.cdmGrid02, this.codedetailFilter(row.fgroupid)); // Load filtered rows
				this.wjH.gridScrollToLastRow(this.cdmGrid02, 1);
			}
		});
	}

	codeRemove() {
		var retRx = this.wjH.removeGridRow(this.cdmGrid02, this.codedetail, false, false);
		if (retRx) retRx.subscribe(()=> {
			var row = this.wjH.getGridSelectecRow(this.cdmGrid01);
			this.wjH.gridLoad(this.cdmGrid02, this.codedetailFilter(row.fgroupid)); // Load filtered rows
		});
	}

	gridRepaint() {
        setTimeout(() => {
			this.wjH.gridRedraw(this.cdmGrid01);
			this.wjH.gridRedraw(this.cdmGrid02);
		}, 100);
    }

	// Resize gridlist to fill window
	onResize(event) {
		setTimeout(() => {
			this.wH = window.innerHeight - 50;
		}, 100);
	};

	initGrids() {
		// wj-flex-grid
        this.cdmGrid01.initialize({
			isReadOnly: true,
			selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.cdmGrid01, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.cdmGrid01);
					if (!row) return;
					setTimeout(() => { // Allow cellEditEnding from cdmGrid02 to finish
						this.wjH.gridLoad(this.cdmGrid02, this.codedetailFilter(row.fgroupid)); // Load filtered rows
					}, 50);
                }
            },
            columns: [
				{ binding: "fgroupid", header: "Group", width: 150 },
				{ binding: "fdescription", header: "Description", width: 300 }
            ]
        });
		this.wjH.gridInit(this.cdmGrid01, true);
		
		// wj-flex-grid
        this.cdmGrid02.initialize({
            columns: [
				{ binding: "fid", header: "ID", width: 200, isReadOnly: true},
				{ binding: "fdescription", header: "Description", width: 250 },
				{ binding: "fopt1", header: "Option 1", width: 150 },
				{ binding: "fopt2", header: "Option 2", width: 150 },
				{ binding: "forder", header: "Sequence", width: 100 }
            ]
        });
        this.wjH.gridInit(this.cdmGrid02);
	}
}