import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { WjFlexGrid } from '@grapecity/wijmo.angular2.grid';
import * as wjCore from '@grapecity/wijmo';
import * as wjGrid from '@grapecity/wijmo.grid';
import * as wjInput from '@grapecity/wijmo.input';
import { DataStore } from './dataentry.service';
import { PcdrFilterPipe } from '../pipes/pcdrfilter.pipe';

@Injectable()
export class wjHelperService {

    constructor(private $filter: PcdrFilterPipe) {}

    gridCreateEditor(editColumn, colType?, colformat?) {
        var grid = editColumn.grid;
        grid.formatItem.addHandler( (s, e)=> {
            var editRange = grid.editRange,
                column = e.panel.columns[e.col];
            // check whether this is an editing cell of the wanted column
            if ((e.panel.cellType == wjGrid.CellType.Cell && editRange && column == editColumn && editColumn.index == e.col && editRange.row == e.row && editRange.col == e.col)) {
                if (e.cell.firstChild) {
                    e.cell.firstChild.style.display = 'none';
                }
                var editRoot = document.createElement('div');
                let inpt;
                // if(column.dataType==wjCore.DataType.String){
                //     inpt = new wjInput.ComboBox(editRoot);
                //     inpt.itemsSource = this.countries;
                //     inpt.selectedValue = grid.getCellData(e.row, e.col);
                //     inpt.displayMemberPath = 'country';
                //     inpt.selectedValuePath = 'country';
                // }
                if(column.dataType==wjCore.DataType.Date || colType == 'Date'){
                    inpt= new wjInput.InputDate(editRoot, {format: colformat, isRequired: false});
                    inpt.value = grid.getCellData(e.row, e.col);
                }
                e.cell.appendChild(editRoot);
                
                // Format To remove border
                var rc = grid.getCellBoundingRect(e.row, e.col);
                wjCore.setCss(inpt.hostElement, {
                    position: 'absolute',
                    // left: rc.left - 1 + pageXOffset,
                    left: - 1 + pageXOffset,
                    top: rc.top - 1 + pageYOffset,
                    width: rc.width + 1,
                    height: grid.rows[e.row].renderHeight + 1,
                    borderRadius: '0px'
                });

                inpt.focus();
                // cellEditEnding that updates cell with user's input
                var editEndingEH = function (s, args) {
                    grid.cellEditEnding.removeHandler(editEndingEH);
                    if (!args.cancel) {
                        args.cancel = true;
                        if(column.dataType==wjCore.DataType.String){
                            grid.setCellData(args.row, args.col, inpt.selectedValue);
                        }
                        if(column.dataType==wjCore.DataType.Date || colType == 'Date'){
                            grid.setCellData(args.row, args.col, inpt.value);
                        }
                    }
                };
                // subscribe the handler to the cellEditEnding event
                grid.cellEditEnding.addHandler(editEndingEH);
            }
        });
    }
    
    // Enables Tab Key to change fields
    onGridKeyPress(s: WjFlexGrid, e: any) {
        if (s.rows.length == 0) return false; // No rows
        const n = (window.event) ? e.which : e.keyCode;
        if (n === 9) {
            if (e.shiftKey) { // Shift+Tab
                if (s.selection.col === 0) { // First Column
                    if (s.selection.row === 0) { // First Row, do nothing
                        return true;
                    }
                    // Previous row, last column
                    s.select(new wjGrid.CellRange(s.selection.row - 1, s.columns.length - 1));
                } else {
                    s.select(new wjGrid.CellRange(s.selection.row, s.selection.col - 1));
                }
                return false;
            }
            if (s.selection.col === s.columns.length - 1) {
                if (s.selection.row === s.rows.length - 1) {
                    return true;
                }
                let i = 0;
                while (s.columns[i].isReadOnly) {
                    i++;
                }
                s.select(new wjGrid.CellRange(s.selection.row + 1, i));
            } else {
                let i = s.selection.col + 1;
                while (s.columns[i].hasOwnProperty('isReadOnly') && s.columns[i].isReadOnly) {
                    i++;
                }
                s.select(new wjGrid.CellRange(s.selection.row, i));
            }
            return false;
        }
    }

    // Used for editing grids
    onGridGotFocus = (s: WjFlexGrid, e) => {
        s.startEditing(true); // quick mode
    }
    // Used for editing grids
    onGridSelectionChanged(s, e) {
        setTimeout(function () {
           s.startEditing(true); // quick mode
        }, 10); // let the grid update first
    };

    gridInit(s, pallowSorting = false) {
        s.autoGenerateColumns = false;
        s.selectionMode = wjGrid.SelectionMode.Row;
        s.allowSorting = pallowSorting;
        s.headersVisibility = 1;
    }

    gridLoad(s: WjFlexGrid, dataSource, disableSelect = true) {
        s['mPrevRow'] = null; // Clear custom property
        s.itemsSource = []; // Clear source
        s.itemsSource = dataSource; // Reasign
        if (disableSelect) s.select(-1, -1); // Don't display initial selection
        // s.select(new wjGrid.CellRange(-1)); // Don't display initial selection
    }

    gridScrollToLastRow(s: WjFlexGrid, column: number = 0) {
        s.select(new wjGrid.CellRange(s.rows.length - 1, column));
    }

    gridScrollToRow(s: WjFlexGrid, col:number, row:number, filterField:string = '', filterValue: any = null) {
        // instead of row, a value to compare is passed
        if (filterField) {
            row = s.itemsSource.findIndex((row) => { return (row[filterField] == filterValue); });
        }
        s.select(new wjGrid.CellRange(row, col)); // selects and focus field
    }

    removeGridRow(s: WjFlexGrid, store: DataStore, newOnly = false, loadrows = true, disableSelect = true) {
        var row = this.getGridSelectecRow(s);
        if (!row) return; // No selected row
        
        if (newOnly && store.isNew(row) || newOnly == false) {
            return Observable.create(observer => {
                store.removeRow(row).subscribe(() => {
                    if (loadrows) this.gridLoad(s, store.items, disableSelect); // Load Data
                    observer.next();
                });
            });
        }
    }

    rowCount(s: WjFlexGrid) {
        return s.rows.length;
    }

    getGridSelectecRow(s: WjFlexGrid) {
        // return (s.rows.length == 0)? null: s.rows[s.selection.row].dataItem;
        if (s.rows.length == 0) return null;
        if (s.selection.row >= 0) {
            return s.rows[s.selection.row].dataItem;
        }
        return null;
    }

    gridSelectNextRow(pGrid: WjFlexGrid) {
        if (pGrid.rows.length == 0) return;
        if (pGrid.selection.row >= 0) {
            pGrid.select(new wjGrid.CellRange(pGrid.selection.row + 1));
        }
    }
    
    gridSelectPrevRow(pGrid: WjFlexGrid) {
        if (pGrid.rows.length == 0) return;
        if (pGrid.selection.row > 0) {
            pGrid.select(new wjGrid.CellRange(pGrid.selection.row - 1));
        }
    }

    gridSelectChanged(pGrid, row) {
        // Create new property to save prev row
        if (pGrid.mPrevRow !== row) {
            pGrid.mPrevRow = row;
            return true;
        }
        return false;
    }

    gridRedraw(s: WjFlexGrid) {
        setTimeout(() => { s.refresh(); }, 10);
    }

    // See if editing current cell
    gridEditingCell(s: WjFlexGrid, e) {
        return (s.selection.col == e.col && s.selection.row == e.row );
    }

    // No longer needed 2020/08/08
    // gridRowDblClick(e) {
    //     return (['wj-state-selected','wj-alt'].indexOf(e.srcElement.classList[1]) >= 0);
    // }

    // Transfor data fields to make wijmo control work properly
    dataTransform(data, colname, type) {
        for (let row of data) {
            // Change from numeric to boolean
            if (type == 'Boolean') {
                row[colname] = (row[colname] == 1) ? true: false;
            }
        }
    }

    // Fix focus border for input fields parent element
    inputGotFocus(s, type = '') {
        switch(type) {
            case 'input-mask':
                s._tbx.parentElement.parentElement.parentElement.classList.add('mwj-form-control-focus');
                break;
            default:
                s._tbx.parentElement.parentElement.parentElement.parentElement.classList.add('mwj-form-control-focus');
        }
    }
    // Fix focus border for input fields
    inputLostFocus(s, type = '') {
        switch(type) {
            case 'input-mask':
                s._tbx.parentElement.parentElement.parentElement.classList.remove('mwj-form-control-focus');
                break;
            default:
                s._tbx.parentElement.parentElement.parentElement.parentElement.classList.remove('mwj-form-control-focus');
        }
    }

    fixWM() {
        // var els = document.querySelectorAll("a[href^='http://wijmo.com/products/wijmo-5/eval/']");
        //var els = document.querySelectorAll("a[href^='http://wij']");
        // <a href="https://www.grapecity.com/en/licensing/wijmo" target="_blank" rel="noopener">Wijmo Evaluation Version (5.20182.500)</a>
        // var els = document.querySelectorAll("a[href^='https://www.grapecity.com']");
        
        // 2020/08/12 No longer works
        // setTimeout(() => {
        //     var els = document.querySelectorAll("a[href^='https://www.grapecity.com/licensing/wijmo']"); //2020/07/14
        //     if (els[0]) els[0].parentElement.setAttribute('style', 'visibility: hidden;');
        // }, 5);
    }
}