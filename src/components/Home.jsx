import React from "react";
import FloatingButton from "../FloatingButton";
import PostList from "./PostList";

const Home = () => {
  return (
    <div className="min-h-screen  relative pb-20">
      {/* App Title */}
      <h1 className="p-6 text-3xl font-bold">Feed</h1>

      

      {/* List of Posts */}
      <PostList />
    </div>
  );
};

export default Home;