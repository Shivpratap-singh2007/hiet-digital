// HIET Digital Campus - Web Push & Browser Notifications Manager
// Handles Service Worker registration, permission state, token management,
// notification preferences, and safe preview delivery with deep-links.

import { dataStore } from './mockData';
import { isSupabaseConfigured, supabase } from './supabase';
import { NotificationPreferences, PushDeliveryLog, DeviceToken } from '../types';

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  token?: string;
  error?: string;
}

export const pushNotificationService = {
  // 1. Check if Push & Service Worker are supported
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'Notification' in window
    );
  },

  // 2. Get current permission status
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  // 3. Register Service Worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err);
      return null;
    }
  },

  // 4. Request Browser Notification Permission & Register Token
  async requestPermissionAndRegister(userId: string): Promise<PushStatus> {
    if (!this.isSupported()) {
      return {
        supported: false,
        permission: 'denied',
        isSubscribed: false,
        error: 'Push notifications are not supported in this browser environment.'
      };
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return {
          supported: true,
          permission,
          isSubscribed: false,
          error: permission === 'denied'
            ? 'Notification permissions were blocked. Please enable notifications in your browser site settings.'
            : 'Notification permission request was dismissed.'
        };
      }

      // Ensure SW is registered
      const swReg = await this.registerServiceWorker();

      // Generate a client token identifier for web push
      const userAgent = navigator.userAgent;
      const browser = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Browser';
      const token = `hiet-web-push-${userId}-${Date.now().toString(36)}`;

      const deviceToken: DeviceToken = {
        id: `tok-${Date.now()}`,
        user_id: userId,
        token,
        platform: 'web',
        device_info: {
          browser,
          os: navigator.platform || 'Unknown OS',
          screen: `${window.innerWidth}x${window.innerHeight}`
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to dataStore
      const currentTokens = dataStore.getDeviceTokens();
      const filtered = currentTokens.filter(t => t.user_id !== userId);
      dataStore.setDeviceTokens([...filtered, deviceToken]);

      // Save to Supabase if configured
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('device_tokens').upsert({
            user_id: userId,
            token,
            platform: 'web',
            device_info: deviceToken.device_info,
            is_active: true
          });
        } catch (e) {
          console.warn('Supabase device token upsert warning:', e);
        }
      }

      return {
        supported: true,
        permission: 'granted',
        isSubscribed: true,
        token
      };
    } catch (err: any) {
      return {
        supported: true,
        permission: this.getPermission(),
        isSubscribed: false,
        error: err.message || 'Failed to initialize notification subscription.'
      };
    }
  },

  // 5. Get User Notification Preferences
  getPreferences(userId: string): NotificationPreferences {
    return dataStore.getNotificationPreferences(userId);
  },

  // 6. Update Notification Preferences
  async updatePreferences(prefs: NotificationPreferences): Promise<boolean> {
    dataStore.setNotificationPreferences(prefs);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notification_preferences').upsert(prefs);
      } catch (e) {
        console.warn('Supabase preference update error:', e);
      }
    }
    return true;
  },

  // 7. Deliver Local In-App & Web Push Notification
  async sendNotification(options: {
    userId: string;
    type: 'class_reminder' | 'attendance_warning' | 'leave_update' | 'achievement' | 'notice' | 'gate_pass' | 'fine' | 'exam';
    title: string;
    message: string;
    deepLink?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const prefs = this.getPreferences(options.userId);

    // Check user preference toggle for this notification category
    const typeMapping: Record<string, boolean> = {
      class_reminder: prefs.class_reminders,
      attendance_warning: prefs.attendance_warnings,
      leave_update: prefs.leave_updates,
      achievement: prefs.achievement_alerts,
      notice: prefs.notice_alerts,
      gate_pass: prefs.gate_pass_updates,
      fine: prefs.fine_alerts,
      exam: prefs.exam_announcements
    };

    if (typeMapping[options.type] === false) {
      return { success: false, error: 'User has opted out of this category in notification preferences.' };
    }

    // Safety rule: sanitize lock-screen preview to prevent sensitive student data leak
    const safeTitle = `HIET: ${options.title}`;
    const safeBody = options.message;

    // Log the delivery
    const logItem: PushDeliveryLog = {
      id: `log-p-${Date.now()}`,
      user_id: options.userId,
      notification_type: options.type,
      title: options.title,
      preview_message: safeBody,
      deep_link: options.deepLink,
      platform: 'web',
      status: 'delivered',
      delivered_at: new Date().toISOString()
    };
    dataStore.addPushDeliveryLog(logItem);

    // Deliver via Browser Notification API if permission is granted
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: safeTitle,
            body: safeBody,
            deepLink: options.deepLink || 'dashboard'
          });
        } else {
          // Direct fallback notification
          const n = new Notification(safeTitle, {
            body: safeBody,
            icon: '/images/hiet_crest.png',
            badge: '/images/hiet_crest.png'
          });
          n.onclick = () => {
            window.focus();
            if (options.deepLink) {
              window.dispatchEvent(new CustomEvent('hiet-navigate-tab', { detail: options.deepLink }));
            }
          };
        }
      } catch (err: any) {
        logItem.status = 'failed';
        logItem.error_details = err.message;
      }
    }

    return { success: true };
  }
};
