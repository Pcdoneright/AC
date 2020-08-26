import {Component, OnDestroy, AfterViewInit, ViewChild} from '@angular/core';
import { finalize } from 'rxjs/operators'
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import {ToastrService} from 'ngx-toastr';
import { OrderByPipe } from 'ngx-pipes';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import { SharedService } from '../../services/shared.service';
import {DataService} from '../../services/data.service';
import {DataEntryService, DataStore} from '../../services/dataentry.service';
import {CompanyService} from '../../services/company.service';
import {PcdrFilterPipe} from '../../pipes/pcdrfilter.pipe';
import {ListPrograms} from '../../lists/list-programs.component';
import { wjHelperService } from '../../services/wjHelper.service';
import { pcdrBuilderComponent } from '../../services/builder/builder.component';
import { appHelperService } from '../../services/appHelper.service';

@Component({
    selector: 'app-programmaint',
    templateUrl: './programmaint.component.html',
    providers: [DataEntryService],
})

export class ProgMaintComponent implements OnDestroy, AfterViewInit {
    @ViewChild('bar01', {static: true}) bar01: pcdrBuilderComponent;
    @ViewChild('bar02', {static: true}) bar02: pcdrBuilderComponent;
    @ViewChild('prmGrid01', {static: true}) prmGrid01: WjFlexGrid;
    @ViewChild('prmGrid02', {static: true}) prmGrid02: WjFlexGrid;
    sortPipe: OrderByPipe = new OrderByPipe();

    @ViewChild('prmsp01') sp01;
    wH: number;
    groups: DataStore;
    groups_access: DataStore;
    programsList: any;

    constructor(private toastr: ToastrService, private dialog: MatDialog, private CompanySvc: CompanyService, 
        public dESrvc: DataEntryService, private DataSvc: DataService, public appH: appHelperService,
        public $filter: PcdrFilterPipe, public wjH: wjHelperService, private sharedSrvc: SharedService) {

        this.sharedSrvc.setProgramRights(this, 'programrights'); // sets fupdate, fadmin
        window.onresize = (e) => this.onResize(e); // Capture resize event
        this.onResize(null); // Execute at start
        
        this.groups = this.dESrvc.newDataStore('groups', ['fgroupid'], true, ['fname']);
        this.dESrvc.validateDataStore('groups', 'GROUP RIGHT', 'fname', 'NAME');
        this.groups_access = this.dESrvc.newDataStore('groups_access', ['fgroupid', 'fprogid'], true, ['fgroupid', 'fprogid']);
    }

    ngOnInit() {
        this.bar01.setNavProperties(this, {
            title: 'Group Right', 
            buttons: [
                {name: ' Add', style: 'success', icon: 'fa fa-plus-circle', action: 'groupsAdd'},
                {name: ' Remove', style: 'danger', icon: 'fa fa-minus-circle', action: 'groupsRemove'},
                {name: 'Save', style: 'primary', action: 'update'}
            ],
            subnavbar: false,
            rows: {grid: 'prmGrid01'}
        })

        this.bar02.setNavProperties(this, {
            title: 'Programs', 
            buttons: [
                {name: ' Add', style: 'success', icon: 'fa fa-plus-circle', action: 'groups_accessAdd'},
                {name: ' Remove', style: 'danger', icon: 'fa fa-minus-circle', action: 'groups_accessRemove'}
            ],
            subnavbar: false,
            rows: {grid: 'prmGrid02'}
        })
    }

    // barXX Events
    onClickNav(parm) {
        this[parm.action](parm.val);
    }


    ngAfterViewInit() {
        this.initGrids();
        this.wjH.fixWM();	

        this.DataSvc.serverDataGet('api/GroupsMaint/GetGroups').subscribe((dataResponse) => {
            this.groups.loadData(dataResponse.groups);
            this.wjH.gridLoad(this.prmGrid01, this.groups.items, false);
            
            this.groups_access.loadData(dataResponse.groups_access);
        });

        // Get Programs for List
        this.DataSvc.serverDataGet('api/GroupsMaint/GetPrograms').subscribe((dataResponse) => {
            this.programsList = dataResponse;
        });
    }

    ngOnDestroy() {
        this.groups.clearData();
        this.groups_access.clearData();
    }

    update() {
        if (!this.dESrvc.checkForChanges()) return;
        if (this.dESrvc.validate() !== '') return;

        this.CompanySvc.ofHourGlass(true);
        // Send to Server
        this.dESrvc.update('api/GroupsMaint/Postupdate')
            .pipe(finalize(()=> this.CompanySvc.ofHourGlass(false)))
            .subscribe();
    }

    groups_accessFilter(pfgroupid): any[] {
        let rows = this.$filter.transform(this.groups_access.items, {fgroupid: pfgroupid}, true);
        rows = this.sortPipe.transform(rows, ["fgrouptype", "fsequence"]);
        return rows;
    }

    groupsAdd() {
        this.groups.addRow({
            fgroupid: this.dESrvc.getMaxValue(this.groups.items, 'fgroupid') + 1
        });

        this.wjH.gridLoad(this.prmGrid01, this.groups.items, false); // Load Data, no refresh, since scroll will doit
        this.wjH.gridScrollToLastRow(this.prmGrid01, 1); // Scroll to new row & edit
    }

    groupsRemove() {
        // Make sure no details exist
        if (this.wjH.rowCount(this.prmGrid02) > 0) {
            this.toastr.warning('Must First Remove All PROGRAMS');
            return;
        }

        var ret = this.wjH.removeGridRow(this.prmGrid01, this.groups, false, true, false);
        if (ret) {
            // Row was removed clear rows
            ret.subscribe(()=> {
                this.wjH.gridLoad(this.prmGrid02, []);
            });
        }
    }

    groups_accessAdd() {
        var row = this.wjH.getGridSelectecRow(this.prmGrid01);
        if (!row) return; // Invalid

        let dialogRef: MatDialogRef<ListPrograms>;
        dialogRef = this.dialog.open(ListPrograms);
        dialogRef.componentInstance.programsGridData = this.programsList;
        dialogRef.afterClosed().subscribe((retValue)=> {
            if (retValue) {
                var currentRows = this.prmGrid02.rows;
                // exit if already exists
                if (this.$filter.transform(currentRows, {fprogid: retValue.fprogid}, true).length > 0) return;

                this.groups_access.addRow({
                    fgroupid: row.fgroupid,
                    fprogid: retValue.fprogid,
                    cfname: retValue.fname,
                    fsequence: this.dESrvc.getMaxValue(currentRows, 'fsequence') + 1,
                    fupdate: false,
                    fadmin: false
                });

                this.wjH.gridLoad(this.prmGrid02, this.groups_accessFilter(row.fgroupid), false); // Load Data, no refresh
                this.wjH.gridScrollToLastRow(this.prmGrid02, 0); // Scroll to new row
            }
        });
    }

    groups_accessRemove() {
        var ret = this.wjH.removeGridRow(this.prmGrid02, this.groups_access, false, false); // Remove but don't reload data
        if (ret) {
            // Row was removed reload using filter
            ret.subscribe(()=> {
                var rec = this.wjH.getGridSelectecRow(this.prmGrid01); // get selected master row
                this.wjH.gridLoad(this.prmGrid02, this.groups_accessFilter(rec.fgroupid)); // Load filtered rows
            });
        }
    }

    fsequenceArrange(pfprogid, pfsequence) {
        var rows = this.prmGrid02.rows;
        console.log(rows)
        // Increment Equal or Greater Values
        for (var i = 0; i < rows.length; i++) {
            var obj = rows[i];
            console.log(obj['fsequence']);
            // TODO: Not working with NG10
            if (obj['fsequence'] == null) continue; // Skip
            if (obj['fsequence'] >= pfsequence && obj['fprogid'] !== pfprogid) obj['fsequence']++; // Increment
            // if (obj.fsequence == null) continue; // Skip
            // if (obj.fsequence >= pfsequence && obj.fprogid !== pfprogid) obj.fsequence++; // Increment
        }
        // Get List Sorted and Reasign Sequence Starting with 1
        var nrows = this.sortPipe.transform(rows, 'fsequence');
        var nseq = 0;
        for (var i = 0; i < nrows.length; i++) {
            if (nrows[i].fsequence == null) continue; // Skip
            nseq++;
            nrows[i].fsequence = nseq;
        }
    }

    gridRepaint() {
        setTimeout(() => {
			this.wjH.gridRedraw(this.prmGrid01);
			this.wjH.gridRedraw(this.prmGrid02);
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
        this.prmGrid01.initialize({
			selectionChanged: (s, e) => {
                if (this.wjH.gridSelectChanged(this.prmGrid01, e.row)) {
                    var row = this.wjH.getGridSelectecRow(this.prmGrid01);
					if (!row) return;
					setTimeout(() => { // Allow cellEditEnding from cdmGrid02 to finish
						this.wjH.gridLoad(this.prmGrid02, this.groups_accessFilter(row.fgroupid)); // Load filtered rows
					}, 50);
                }
            },
            columns: [
				{ binding: "fgroupid", header: "ID", width: 50, isReadOnly: true },
                { binding: "fname", header: "Name", width: '*' }
            ]
        });
        this.wjH.gridInit(this.prmGrid01, true);

        // wj-flex-grid
        this.prmGrid02.initialize({
            cellEditEnding: (s, e) => {
                var col = s.columns[e.col];
                var rec = s.rows[e.row].dataItem;
                if (s.activeEditor.value == rec[col.binding]) return; // Only if changes

                switch (col.binding) {
                    case 'fsequence':
                        rec.fsequence = this.CompanySvc.validNumber(s.activeEditor.value.toString()); // Convert to number;
                        // this.fsequenceArrange(rec.fprogid, rec.fsequence);
                        break;
                }
            },
            columns: [
                {binding: "fsequence", header: "Sequence", width: 120 },
                {binding: "fdescription", header: "Menu", width: 200, isReadOnly: true },
                {binding: "cfname", header: "Program", width: '*', isReadOnly: true },
                {binding: "fupdate", header: "Update", width: 70 },
                {binding: "fadmin", header: "Admin", width: 70 }
            ]
        });
        this.wjH.gridInit(this.prmGrid02);
    }
}
