import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleChoisesComponent } from './multiple-choises.component';

describe('MultipleChoisesComponent', () => {
  let component: MultipleChoisesComponent;
  let fixture: ComponentFixture<MultipleChoisesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultipleChoisesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultipleChoisesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
