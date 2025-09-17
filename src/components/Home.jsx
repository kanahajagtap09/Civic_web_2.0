import React from "react";
import FloatingButton from "../FloatingButton";
import PostList from "./PostList";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100 relative pb-20">
      {/* App Title */}
      <h1 className="p-6 text-3xl font-bold">Feed</h1>

      {/* Floating Action Button for creating posts */}
      <FloatingButton />

      {/* List of Posts */}
      <PostList />
    </div>
  );
};

export default Home;