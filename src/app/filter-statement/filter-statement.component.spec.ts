import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterStatementComponent } from './filter-statement.component';

describe('FilterStatementComponent', () => {
  let component: FilterStatementComponent;
  let fixture: ComponentFixture<FilterStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilterStatementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
