import { Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators'
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import { DataService } from '../../services/data.service';
import { SharedService } from '../../services/shared.service';
import { DataEntryService, DataStore } from '../../services/dataentry.service';
import { CompanyService } from '../../services/company.service';
import { wjHelperService } from '../../services/wjHelper.service';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';

@Component({
	selector: 'taxrates',
	templateUrl: './taxrates.html',
	providers: [DataEntryService],
})
export class taxrates implements OnDestroy, AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('taxratesGrid', {static: true}) taxratesGrid: WjFlexGrid;
	fadmin: boolean = false;
    fupdate: boolean = false;
	wH: number;
	taxrates: DataStore;

	constructor(private CompanySvc: CompanyService, public dESrvc: DataEntryService, private DataSvc: DataService, private sharedSrvc: SharedService, 
		public wjH: wjHelperService) {
	
		this.sharedSrvc.setProgramRights(this, 'taxrates'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
		this.onResize(null); // Execute at start
		
		this.taxrates = this.dESrvc.newDataStore('taxrates', [], true, ['fdescription', 'frate']);
		this.dESrvc.validateDataStore('taxrates', 'TAX', 'fdescription', 'TAX LOCATION');
		this.dESrvc.validateDataStore('taxrates', 'TAX', 'frate', 'RATE');
	}

	ngAfterViewInit() {
		this.initGrids();
		this.wjH.fixWM();
		
		this.DataSvc.serverDataGet('api/TaxMaint/GetList').subscribe((dataResponse) => {
			this.taxrates.loadData(dataResponse);
			this.wjH.gridLoad(this.taxratesGrid, this.taxrates.items);
		});
    }
    
    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Sales Tax Rates', 
            buttons: [
                {name: 'Save', style: 'primary', action: 'update'},
                {name: ' Add', style: 'success', icon: 'fa fa-plus-circle', action: 'add'},
                {name: ' Remove', style: 'danger', icon: 'fa fa-minus-circle', action: 'remove'}
            ],
            subnavbar: false,
            rows: {grid: 'taxratesGrid'}
        })
    }

    // barXX Events
    onClickNav(parm) {
        this[parm.action](parm.val);
    }

	ngOnDestroy() {
	}

	update() {
		if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
		this.dESrvc.update('api/TaxMaint/Postupdate')
			.pipe(finalize(()=> this.CompanySvc.ofHourGlass(false)))
			.subscribe();
    }

	add() {
		this.taxrates.addRow({
			ftrid: this.dESrvc.getMaxValue(this.taxrates.items, 'ftrid') + 1,
		});

		this.wjH.gridLoad(this.taxratesGrid, this.taxrates.items, false); // Load Data, no refresh
		this.wjH.gridScrollToLastRow(this.taxratesGrid, 1); // Scroll to new row
	}

	remove() {
		this.wjH.removeGridRow(this.taxratesGrid, this.taxrates).subscribe();
	}

	// Resize gridlist to fill window
	onResize(event) {
		setTimeout(() => {
			this.wH = window.innerHeight - 50;
		}, 100);
	};

	initGrids() {
		// wj-flex-grid
        this.taxratesGrid.initialize({
            columns: [
				{binding: "ftrid", header: "ID", width: 90, isReadOnly: true},
                {binding: "fdescription", header: "Tax Location", width: 350},
                {binding: "frate", header: "Rate", width: 100}
            ]
        });
        this.wjH.gridInit(this.taxratesGrid);
	}
}