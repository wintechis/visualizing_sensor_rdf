import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartGridLayoutComponent } from './chart-grid-layout.component';

describe('ChartGridLayoutComponent', () => {
  let component: ChartGridLayoutComponent;
  let fixture: ComponentFixture<ChartGridLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChartGridLayoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartGridLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
