import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AskAxesDialogComponent } from './ask-axes-dialog.component';

describe('AskAxesDialogComponent', () => {
  let component: AskAxesDialogComponent;
  let fixture: ComponentFixture<AskAxesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AskAxesDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AskAxesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
