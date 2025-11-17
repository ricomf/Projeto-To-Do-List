import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { ILogin, IRegister, IAuthResponse } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  const mockAuthResponse: IAuthResponse = {
    user: {
      id: '1',
      nome: 'Test User',
      email: 'test@example.com',
      roles: ['USER']
    },
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, ApiService]
    });

    service = TestBed.inject(AuthService);
    apiService = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const credentials: ILogin = {
        email: 'test@example.com',
        password: 'password123'
      };

      spyOn(apiService, 'post').and.returnValue(
        Promise.resolve(mockAuthResponse) as any
      );

      const result = await service.login(credentials);

      expect(result).toEqual(mockAuthResponse);
      expect(service.isAuthenticated).toBe(true);
      expect(service.currentUserValue).toEqual(mockAuthResponse.user as any);
    });

    it('should store token in localStorage on successful login', async () => {
      const credentials: ILogin = {
        email: 'test@example.com',
        password: 'password123'
      };

      spyOn(apiService, 'post').and.returnValue(
        Promise.resolve(mockAuthResponse) as any
      );

      await service.login(credentials);

      expect(localStorage.getItem('auth_token')).toBe(mockAuthResponse.token);
      expect(localStorage.getItem('refresh_token')).toBe(mockAuthResponse.refreshToken);
    });
  });

  describe('logout', () => {
    it('should clear session on logout', async () => {
      // Setup: login first
      spyOn(apiService, 'post').and.returnValue(
        Promise.resolve(mockAuthResponse) as any
      );

      await service.login({
        email: 'test@example.com',
        password: 'password123'
      });

      // Logout
      await service.logout();

      expect(service.isAuthenticated).toBe(false);
      expect(service.currentUserValue).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const userData: IRegister = {
        nome: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        aceitaTermos: true
      };

      spyOn(apiService, 'post').and.returnValue(
        Promise.resolve(mockAuthResponse) as any
      );

      const result = await service.register(userData);

      expect(result).toEqual(mockAuthResponse);
      expect(service.isAuthenticated).toBe(true);
    });
  });

  describe('getToken', () => {
    it('should return stored token', async () => {
      spyOn(apiService, 'post').and.returnValue(
        Promise.resolve(mockAuthResponse) as any
      );

      await service.login({
        email: 'test@example.com',
        password: 'password123'
      });

      const token = service.getToken();
      expect(token).toBe(mockAuthResponse.token);
    });

    it('should return null when no token exists', () => {
      const token = service.getToken();
      expect(token).toBeNull();
    });
  });

  describe('currentUser$', () => {
    it('should emit current user on login', (done) => {
      spyOn(apiService, 'post').and.returnValue(
        Promise.resolve(mockAuthResponse) as any
      );

      service.currentUser$.subscribe(user => {
        if (user) {
          expect(user.email).toBe('test@example.com');
          done();
        }
      });

      service.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  describe('isAuthenticated$', () => {
    it('should emit true after successful login', (done) => {
      spyOn(apiService, 'post').and.returnValue(
        Promise.resolve(mockAuthResponse) as any
      );

      let emissionCount = 0;
      service.isAuthenticated$.subscribe(isAuth => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial false emission
          expect(isAuth).toBe(true);
          done();
        }
      });

      service.login({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should emit false after logout', (done) => {
      spyOn(apiService, 'post').and.returnValue(
        Promise.resolve(mockAuthResponse) as any
      );

      let loginComplete = false;

      service.isAuthenticated$.subscribe(isAuth => {
        if (loginComplete && !isAuth) {
          expect(isAuth).toBe(false);
          done();
        }
      });

      service.login({
        email: 'test@example.com',
        password: 'password123'
      }).then(() => {
        loginComplete = true;
        service.logout();
      });
    });
  });
});
