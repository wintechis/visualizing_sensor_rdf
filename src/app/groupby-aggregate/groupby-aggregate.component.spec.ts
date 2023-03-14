import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupbyAggregateComponent } from './groupby-aggregate.component';

describe('GroupbyAggregateComponent', () => {
  let component: GroupbyAggregateComponent;
  let fixture: ComponentFixture<GroupbyAggregateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GroupbyAggregateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupbyAggregateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
