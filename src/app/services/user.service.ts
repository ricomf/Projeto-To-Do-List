import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { IUserProfile, IUserPreferences } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userProfileSubject = new BehaviorSubject<IUserProfile | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(private apiService: ApiService) {}

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<IUserProfile> {
    try {
      const profile = await lastValueFrom(
        this.apiService.get<IUserProfile>('users/profile')
      );
      this.userProfileSubject.next(profile);
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: Partial<IUserProfile>): Promise<IUserProfile> {
    try {
      const updatedProfile = await lastValueFrom(
        this.apiService.patch<IUserProfile>('users/profile', updates)
      );
      this.userProfileSubject.next(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(preferences: IUserPreferences): Promise<IUserProfile> {
    try {
      const updatedProfile = await lastValueFrom(
        this.apiService.patch<IUserProfile>('users/preferences', preferences)
      );
      this.userProfileSubject.next(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await lastValueFrom(
        this.apiService.post<{ avatarUrl: string }>('users/avatar', formData)
      );

      // Update local profile with new avatar URL
      const currentProfile = this.userProfileSubject.value;
      if (currentProfile) {
        currentProfile.avatarUrl = response.avatarUrl;
        this.userProfileSubject.next({ ...currentProfile });
      }

      return response.avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  async searchUsers(query: string): Promise<IUserProfile[]> {
    try {
      return await lastValueFrom(
        this.apiService.get<IUserProfile[]>('users/search', {
          params: { q: query }
        })
      );
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUserProfile> {
    try {
      return await lastValueFrom(
        this.apiService.get<IUserProfile>(`users/${userId}`)
      );
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await lastValueFrom(
        this.apiService.post('users/change-password', {
          currentPassword,
          newPassword
        })
      );
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    try {
      await lastValueFrom(
        this.apiService.delete('users/account')
      );
      this.userProfileSubject.next(null);
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }
}
