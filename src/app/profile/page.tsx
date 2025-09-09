"use client";
import { useState, useEffect } from "react";
import { getAuthInstance, signOut, getDb } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "firebase/auth";

interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    phone: '',
    address: '',
    photoURL: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        setUser(user);
        console.log('Firebase user UID:', user.uid);
        
        // Fetch user profile directly from database using client-side Firebase
        try {
          console.log('Fetching user profile for UID:', user.uid);
          const db = getDb();
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User profile fetched from database:', userData);
            
            // Prioritize database photoURL, but fallback to Firebase Auth user photoURL
            const photoURL = userData.photoURL || user.photoURL || '';
            
            const userProfile: UserProfile = {
              id: userDoc.id,
              email: userData.email || user.email || '',
              displayName: userData.displayName || user.displayName || '',
              photoURL: photoURL,
              role: userData.role || 'user',
              phone: userData.phone || '',
              address: userData.address || '',
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              lastLoginAt: userData.lastLoginAt?.toDate() || new Date()
            };
            
            console.log('Profile photoURL sources:', {
              userDataPhotoURL: userData.photoURL,
              userPhotoURL: user.photoURL,
              finalPhotoURL: userProfile.photoURL
            });
            
            setProfile(userProfile);
            setEditForm({
              displayName: userProfile.displayName || '',
              phone: userProfile.phone || '',
              address: userProfile.address || '',
              photoURL: userProfile.photoURL || ''
            });
            setError(null);
          } else {
            console.log('User document not found, creating basic profile');
            // Create a basic profile from Firebase Auth user
            const basicProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              role: 'user',
              phone: '',
              address: '',
              createdAt: new Date(),
              updatedAt: new Date(),
              lastLoginAt: new Date()
            };
            
            console.log('Basic profile photoURL:', {
              userPhotoURL: user.photoURL,
              basicProfilePhotoURL: basicProfile.photoURL
            });
            setProfile(basicProfile);
            setEditForm({
              displayName: basicProfile.displayName || '',
              phone: '',
              address: '',
              photoURL: basicProfile.photoURL || ''
            });
          }
        } catch (error) {
          console.error('Error fetching profile from database:', error);
          setError('Failed to load profile from database. Please try again.');
        }
      } else {
        console.log('No user, redirecting to login');
        router.push("/login");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const testImageUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.log('Image URL test failed:', error);
      return false;
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'profile-images');
    
    const response = await fetch('/api/cloudinary-upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const result = await response.json();
    return result.secure_url;
  };

  async function handleSaveProfile() {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      let photoURL = editForm.photoURL;
      
      // Upload new image if selected
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          photoURL = await uploadImageToCloudinary(selectedImage);
          console.log('Image uploaded successfully:', photoURL);
        } catch (error) {
          console.error('Error uploading image:', error);
          setError('Failed to upload image. Please try again.');
          setIsUploadingImage(false);
          setIsSaving(false);
          return;
        }
        setIsUploadingImage(false);
      }
      
      const db = getDb();
      const userDocRef = doc(db, 'users', profile.id);
      await updateDoc(userDocRef, {
        ...editForm,
        photoURL,
        updatedAt: new Date()
      });
      
      // Update profile state
      const updatedProfile: UserProfile = {
        ...profile,
        ...editForm,
        photoURL,
        updatedAt: new Date()
      };
      setProfile(updatedProfile);
      
      // Reset form and image states
      setSelectedImage(null);
      setImagePreview(null);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut(getAuthInstance());
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/login')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Loading profile...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <div className="flex items-center space-x-4">
              <Link
                href={profile.role === 'admin' ? '/admin' : '/dashboard'}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {profile.role === 'admin' ? 'Admin' : 'Dashboard'}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            {/* Profile Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {(() => {
                    const imageUrl = imagePreview || profile.photoURL;
                    console.log('Rendering profile image:', {
                      imagePreview,
                      profilePhotoURL: profile.photoURL,
                      finalImageUrl: imageUrl,
                      hasImage: !!imageUrl,
                      imageLoadError
                    });
                    
                    if (imageUrl && !imageLoadError) {
                      return (
                        <div className="h-20 w-20 rounded-full border-2 border-gray-200 overflow-hidden relative">
                          <img
                            className="h-full w-full object-cover"
                            src={imageUrl}
                            alt={profile.displayName || profile.email}
                            onLoad={() => {
                              console.log('Image loaded successfully:', imageUrl);
                              setImageLoadError(false);
                            }}
                            onError={(e) => {
                              console.log('Image failed to load:', imageUrl, e);
                              setImageLoadError(true);
                            }}
                            style={{
                              display: 'block',
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                          {/* Loading indicator */}
                          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-200 relative group">
                          <span className="text-2xl font-medium text-gray-600">
                            {profile.displayName?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                          </span>
                          {imageLoadError && (
                            <button
                              onClick={() => {
                                setImageLoadError(false);
                                console.log('Retrying image load for:', imageUrl);
                              }}
                              className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Retry loading image"
                            >
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    }
                  })()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profile.displayName || 'User'}
                  </h2>
                  <p className="text-gray-600">{profile.email}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {profile.role} • Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="px-6 py-4 bg-blue-50 border-l-4 border-blue-400">
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Debug Info:</p>
                  <p className="text-blue-700">PhotoURL: {profile.photoURL || 'None'}</p>
                  <p className="text-blue-700">Image Preview: {imagePreview || 'None'}</p>
                  <p className="text-blue-700">User Email: {user?.email || 'None'}</p>
                  <p className="text-blue-700">User PhotoURL: {user?.photoURL || 'None'}</p>
                  <p className="text-blue-700">Image Load Error: {imageLoadError ? 'Yes' : 'No'}</p>
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Test image URL"
                      className="text-xs px-2 py-1 border rounded"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const url = (e.target as HTMLInputElement).value;
                          if (url) {
                            console.log('Testing image URL:', url);
                            setProfile(prev => prev ? { ...prev, photoURL: url } : null);
                            setImageLoadError(false);
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Test image URL"]') as HTMLInputElement;
                        const url = input?.value;
                        if (url) {
                          console.log('Testing image URL:', url);
                          setProfile(prev => prev ? { ...prev, photoURL: url } : null);
                          setImageLoadError(false);
                        }
                      }}
                      className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Test
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="px-6 py-4 bg-red-50 border-l-4 border-red-400">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Form */}
            <div className="px-6 py-4">
              {isEditing ? (
                <div className="space-y-4">
                  {/* Profile Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {imagePreview || profile.photoURL ? (
                          <img
                            className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                            src={imagePreview || profile.photoURL}
                            alt="Profile preview"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-200">
                            <span className="text-lg font-medium text-gray-600">
                              {profile.displayName?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving || isUploadingImage}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
                    >
                      {isUploadingImage ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : isSaving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedImage(null);
                        setImagePreview(null);
                        setError(null);
                      }}
                      disabled={isSaving || isUploadingImage}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.displayName || 'Not set'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.phone || 'Not set'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.address || 'Not set'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Last Login
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(profile.lastLoginAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
