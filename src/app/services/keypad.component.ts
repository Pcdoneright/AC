import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'keypad',
    templateUrl: './keypad.component.html',
    styleUrls: ['./keypad.component.css'],
    encapsulation: ViewEncapsulation.None
})

export class KeyPadComponent {
    @Input() keypadValue: string;
    @Input() keypadEnterLabel: string = "Enter";
    @Input() keypadEnterClass: string = "";
    @Input() keypadAppend: boolean = true;
    @Output() keypadValueChange = new EventEmitter<string>();
    @Output() keypadEnter = new EventEmitter();
    firstInput = true;

    pinEntry(input) {
        switch (input) {
            // Clear
            case 'C':
                this.keypadValue = '';
                break;
            // Backspace
            case 'B':
                if (this.keypadAppend) {
                    this.keypadValue = (this.keypadValue) ? this.keypadValue.substring(0, this.keypadValue.length - 1) : '';
                }
                else {
                    this.keypadValue = input;
                }
                break;
            // Actual Value
            default:
                if (this.firstInput) {
                    this.keypadValue = '';
                    this.firstInput = false;
                }

                if (this.keypadAppend) {
                    this.keypadValue = (this.keypadValue) ? this.keypadValue.toString() + input : input;
                }
                else {
                    this.keypadValue = input;
                }
        }
        // console.log('this.keypadAppend', this.keypadAppend);
        // console.log('this.keypadValue', this.keypadValue);
        // Notify parent
        this.keypadValueChange.emit(this.keypadValue);
    }

    pinEnter() {
        // Notify parent
        this.keypadEnter.emit();
    }
}