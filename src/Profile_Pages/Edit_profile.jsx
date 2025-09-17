import React, { useState, useEffect } from 'react';
import { getAuth } from "firebase/auth";
import { db } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Edit_profile = () => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState(['']);
  const [profileImage, setProfileImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setName(data.name || '');
        setBio(Array.isArray(data.bio) ? data.bio.join('\n') : (data.bio || ''));
        setLinks(Array.isArray(data.links) && data.links.length > 0 ? data.links : ['']);
        setProfileImage(data.profileImage || '');
        setImagePreview(
          data.profileImage
            ? (data.profileImage.startsWith('http') || data.profileImage.startsWith('data:')
                ? data.profileImage
                : `data:image/jpeg;base64,${data.profileImage}`)
            : '/default-avatar.png'
        );
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // Handle image file input
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setProfileImage(reader.result); // Save as base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    const userRef = doc(db, "users", currentUser.uid);

    // Prepare data
    const updateData = {
      name: name.trim(),
      bio: bio.split('\n').map(line => line.trim()).filter(Boolean),
      links: links.map(link => link.trim()).filter(link => link !== ''),
      uid: currentUser.uid,
      email: currentUser.email,
      profileImage: profileImage || "",
      updatedAt: new Date().toISOString(),
    };

    try {
      // Use setDoc with merge to create or update
      await setDoc(userRef, updateData, { merge: true });
      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        navigate("/profile"); // Go back to profile page
      }, 1000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    }
    setLoading(false);
  };

  // Handle link change
  const handleLinkChange = (idx, value) => {
    setLinks(prev => {
      const newLinks = [...prev];
      newLinks[idx] = value;
      return newLinks;
    });
  };

  // Add new link field
  const addLinkField = () => setLinks(prev => [...prev, '']);

  // Remove link field
  const removeLinkField = (idx) => setLinks(prev => prev.filter((_, i) => i !== idx));

  // Cancel button handler
  const handleCancel = () => {
    navigate("/profile");
  };

  // Back arrow handler (same as cancel)
  const handleBack = () => {
    navigate("/profile");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 mb-20">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg border border-gray-100">
        <div className="flex items-center mb-6">
          {/* Back Arrow Icon */}
          <button
            type="button"
            onClick={handleBack}
            className="mr-3 text-blue-600 hover:text-blue-800 focus:outline-none"
            title="Back to Profile"
          >
            {/* Heroicons solid/outline arrow-left */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
            Edit Profile
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center mb-4">
            <label htmlFor="fileInput" className="cursor-pointer">
              <img
                src={imagePreview || "/default-avatar.png"}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 mb-2 transition hover:opacity-80"
                title="Click to change profile photo"
              />
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
                style={{ display: "none" }}
              />
            </label>
            <span className="text-xs text-gray-500">Click the photo to change</span>
          </div>
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Name</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={40}
              placeholder="Your Name"
              disabled={loading}
            />
          </div>
          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Bio</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Write something about yourself..."
              maxLength={200}
              disabled={loading}
            />
            <div className="text-xs text-gray-400 text-right">{bio.length}/200</div>
          </div>
          {/* Links */}
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Links</label>
            {links.map((link, idx) => (
              <div key={idx} className="flex items-center mb-2">
                <input
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                  value={link}
                  onChange={e => handleLinkChange(idx, e.target.value)}
                  placeholder="https://your-link.com"
                  disabled={loading}
                  type="url"
                  pattern="https?://.+"
                />
                {links.length > 1 && (
                  <button
                    type="button"
                    className="ml-2 text-red-500 hover:text-red-700 transition"
                    onClick={() => removeLinkField(idx)}
                    disabled={loading}
                  >Remove</button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 text-sm mt-1 font-medium"
              onClick={addLinkField}
              disabled={loading}
            >+ Add Link</button>
          </div>
          {/* Error/Success */}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
              onClick={handleCancel}
              disabled={loading}
            >Cancel</button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
              disabled={loading}
            >{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Edit_profile;