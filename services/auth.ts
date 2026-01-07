
import { GeneratedImage } from "../types";

export interface UserData {
  username: string;
  email: string;
  password: string; 
  joinedAt: string;
  status: 'active' | 'suspended';
  history: GeneratedImage[];
  subscription?: 'free' | 'creator' | 'visionary';
}

const STORAGE_KEY = 'nanogen_users';

export const ADMIN_CREDS = {
  username: "admin",
  email: "info@admin.com",
  password: "infoadminpaneldash"
};

export const getStoredUsers = (): UserData[] => {
  const users = localStorage.getItem(STORAGE_KEY);
  return users ? JSON.parse(users) : [];
};

const saveUsers = (users: UserData[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Local Storage Full", e);
    alert("Storage is full. Oldest images were removed.");
    users.forEach(u => {
        if(u.history.length > 0) u.history = u.history.slice(0, 5); 
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
};

export const registerUser = (user: Omit<UserData, 'joinedAt' | 'status' | 'history'>): { success: boolean; message: string } => {
  const users = getStoredUsers();
  
  if (users.some(u => u.username === user.username)) {
    return { success: false, message: "Username already taken" };
  }
  if (users.some(u => u.email === user.email)) {
    return { success: false, message: "Email already registered" };
  }

  const newUser: UserData = {
    ...user,
    joinedAt: new Date().toISOString(),
    status: 'active',
    history: [],
    subscription: 'free'
  };

  users.push(newUser);
  saveUsers(users);
  
  return { success: true, message: "Account created successfully" };
};

export const updateUser = (oldUsername: string, updates: Partial<UserData>): { success: boolean; user?: UserData; message: string } => {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.username === oldUsername);
  
  if (index === -1) return { success: false, message: "User not found" };

  // Check unique constraints if changing
  if (updates.username && updates.username !== oldUsername) {
    if (users.some(u => u.username === updates.username)) return { success: false, message: "Username already taken" };
  }

  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return { success: true, user: users[index], message: "Profile updated successfully" };
};

export const addImageToUserHistory = (username: string, image: GeneratedImage) => {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.username === username);
  if (index !== -1) {
    const currentHistory = users[index].history || [];
    const newHistory = [image, ...currentHistory].slice(0, 20);
    users[index].history = newHistory;
    saveUsers(users);
  }
};

export const clearUserHistory = (username: string) => {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.username === username);
  if (index !== -1) {
    users[index].history = [];
    saveUsers(users);
  }
};

export const toggleUserStatus = (username: string): UserData[] => {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.username === username);
  if (index !== -1) {
    users[index].status = users[index].status === 'active' ? 'suspended' : 'active';
    saveUsers(users);
  }
  return users;
};

export const deleteUser = (username: string): UserData[] => {
  let users = getStoredUsers();
  users = users.filter(u => u.username !== username);
  saveUsers(users);
  return users;
};

export const loginUser = (usernameOrEmail: string, password: string): { success: boolean; role: 'admin' | 'user' | null; message: string; user?: UserData } => {
  if ((usernameOrEmail === ADMIN_CREDS.username || usernameOrEmail === ADMIN_CREDS.email) && password === ADMIN_CREDS.password) {
    return { success: true, role: 'admin', message: "Welcome Admin" };
  }

  const users = getStoredUsers();
  const user = users.find(u => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password);

  if (user) {
    if (user.status === 'suspended') {
      return { success: false, role: null, message: "Account Suspended. Contact Admin." };
    }
    return { success: true, role: 'user', message: "Login successful", user };
  }

  return { success: false, role: null, message: "Invalid credentials" };
};
