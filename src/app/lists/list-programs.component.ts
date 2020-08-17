import { MatDialogRef } from '@angular/material/dialog';
import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { wjHelperService } from '../services/wjHelper.service';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
declare var $: any;

@Component({
    selector: 'list-programs',
    template: `
        <div md-dialog-content style="width: 450px; padding: 0 5px;">
            <div layout="column" class="widget-grid panel-nobox">
                <nav class="navbar navbar-expand-md bg-primary">
                    <span style="white-space: nowrap;">Program List</span>
                    <div class="container"></div>
                    <span style="white-space: nowrap;">Rows: {{programsGridData.length}}</span>
                </nav>
                <wj-flex-grid #lprogrid01 style="height: 300px"></wj-flex-grid>
            </div>
        </div>
        <div md-dialog-actions class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="dialogRef.close('')">Cancel</button>
            <button type="button" class="btn btn-primary" type="submit" (click)="onYes()">Select</button>
        </div>
    `,
})
export class ListPrograms implements AfterViewInit{
    @ViewChild('lprogrid01') lprogrid01:WjFlexGrid;
    programsGridData = [];

    constructor(public dialogRef: MatDialogRef<ListPrograms>, public wjH: wjHelperService) {}

    ngAfterViewInit() {
        this.initGrids();
        $(document).ready(() => {
            this.wjH.gridLoad(this.lprogrid01, this.programsGridData);
        });
    }

    onYes() {
        let row = this.wjH.getGridSelectecRow(this.lprogrid01);
        this.dialogRef.close(row);
    }

    initGrids() {
        // wj-flex-grid
        this.lprogrid01.initialize({
            isReadOnly: true,
            columns: [
                { binding: "fname", header: "Program", width: '*' }
            ]
        });
        this.wjH.gridInit(this.lprogrid01, true);
    }
}
