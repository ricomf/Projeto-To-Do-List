import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatabaseDebugPage } from './database-debug.page';

describe('DatabaseDebugPage', () => {
  let component: DatabaseDebugPage;
  let fixture: ComponentFixture<DatabaseDebugPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DatabaseDebugPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
