import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('adds and dismisses notifications', () => {
    service.success('Operation succeeded');
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].type).toBe('success');
    expect(service.notifications()[0].message).toBe('Operation succeeded');

    const id = service.notifications()[0].id;
    service.dismiss(id);
    expect(service.notifications().length).toBe(0);
  });
});
