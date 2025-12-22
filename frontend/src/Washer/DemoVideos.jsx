import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useRoleBasedRedirect } from "../utils/roleBasedRedirect";
import NavbarNew from "../components/NavbarNew";
import {
  FiPlay,
  FiEye,
  FiHome,
  FiUser
} from "react-icons/fi";

const DemoVideos = () => {
  useRoleBasedRedirect("employee");
  const navigate = useNavigate();
  const [selectedVideo, setSelectedVideo] = useState(null);

  const handleLogout = async () => {
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const washerMenu = [
    { name: "Dashboard", icon: <FiHome />, link: "/carwash" },
    { name: "My Jobs", icon: <span>💼</span>, link: "/washer/jobs" },
    { name: "Loyalty Points", icon: <span>⭐</span>, link: "/washer/loyalty-points" },
    { name: "Documents", icon: <span>📄</span>, link: "/washer/documents" },
    { name: "Profile", icon: <span>👤</span>, link: "/profile" },
    { name: "Demo Videos", icon: <FiPlay />, link: "/washer/demo-videos" },
  ];

  const demoVideos = [
    {
      id: 1,
      title: "How to Wash a Car",
      description: "Learn the proper techniques for washing a car efficiently and thoroughly. This video covers pre-washing, soap application, scrubbing, rinsing, and drying.",
      duration: "8:45",
      thumbnail: "https://images.unsplash.com/photo-1601584424694-2c0eb0899b12?w=400&h=225&fit=crop",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      category: "Technical",
      points: 10,
    },
    {
      id: 2,
      title: "Customer Communication Skills",
      description: "Master the art of communicating with customers professionally. Learn how to handle inquiries, address concerns, and build customer relationships.",
      duration: "6:30",
      thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=225&fit=crop",
      embedUrl: "https://www.youtube.com/embed/jNQXAC9IVRw",
      category: "Skills",
      points: 8,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <NavbarNew />

      {/* Main Content */}
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">📚 Demo Videos</h1>
            <p className="text-slate-600">
              Watch these training videos to improve your skills and earn bonus points!
            </p>
          </div>

          {/* Video Modal */}
          {selectedVideo && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Close Button */}
                <div className="flex justify-between items-center p-4 border-b border-slate-300">
                  <h2 className="text-xl font-bold text-slate-900">{selectedVideo.title}</h2>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="text-slate-600 hover:text-slate-900 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                {/* Video Player */}
                <div className="flex-1 flex items-center justify-center bg-black p-4">
                  <iframe
                    width="100%"
                    height="100%"
                    src={selectedVideo.embedUrl}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded"
                    style={{ minHeight: "400px" }}
                  ></iframe>
                </div>

                {/* Video Info */}
                <div className="p-4 border-t border-slate-300">
                  <p className="text-slate-700 mb-2">{selectedVideo.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <FiPlay className="text-blue-600" /> {selectedVideo.duration}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {selectedVideo.category}
                    </span>
                    <span className="flex items-center gap-1 text-yellow-600">
                      ⭐ +{selectedVideo.points} points
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoVideos.map((video) => (
              <div
                key={video.id}
                className="group bg-white border border-slate-300 rounded-lg overflow-hidden hover:border-blue-400 transition hover:shadow-lg cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                {/* Thumbnail */}
                <div className="relative overflow-hidden h-48 bg-slate-200">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                    <div className="bg-blue-600 rounded-full p-4 group-hover:scale-110 transition">
                      <FiPlay className="text-white text-2xl" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-sm font-semibold text-white">
                    {video.duration}
                  </div>

                  {/* Points Badge */}
                  <div className="absolute bottom-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    ⭐ +{video.points}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {video.title}
                    </h3>
                  </div>

                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {video.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 rounded-full">
                      {video.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiEye /> Watch to learn
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-12 p-6 bg-blue-50 border border-blue-300 rounded-lg">
            <h3 className="text-xl font-bold text-blue-900 mb-2">💡 Pro Tips</h3>
            <ul className="text-slate-700 space-y-2">
              <li>✅ Watch each video completely to earn bonus loyalty points</li>
              <li>✅ Apply the techniques from these videos in your daily work</li>
              <li>✅ Better customer communication = higher ratings & more bookings</li>
              <li>✅ Master car washing techniques = faster completion = more jobs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoVideos;
