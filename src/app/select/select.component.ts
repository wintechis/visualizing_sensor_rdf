import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css']
})
export class SelectComponent implements OnInit, OnDestroy {

  @Input() options!: string[];
  @Input() label!: string;
  @Input() canNotReset?: any;
  @Input() defaultChoice: string|undefined;

  @Input() resetEventEmitter?: Observable<void>;
  private resetEventSubscription?: Subscription;

  @Output() selectionChange = new EventEmitter<string>();

  /**
   * initalize all which can be selected
   */
  ngOnInit(): void {
    this.resetEventSubscription = this.resetEventEmitter?.subscribe(() => {
      this.defaultChoice = undefined;
    });
  }

  /**
   * deactivate that it does not do anything in the background
   */
  ngOnDestroy(): void {
    this.resetEventSubscription?.unsubscribe();
  }

  /**
   * if sth has changed that it will be automaticly updated
   * @param event 
   */
  change(event: any): void {
    this.selectionChange.emit(event.value);
  }
}
