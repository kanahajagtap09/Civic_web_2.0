import React from 'react';
import Appisinprogress from "../assets/gif1.gif";

const Contact = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center text-white p-4">
      <h1 className="text-4xl font-bold mb-6 text-center">🚧 App Under Construction  Contact page :-🚧</h1>
      <img
        src={Appisinprogress}
        alt="App in Progress"
        className="w-80 md:w-96 rounded-xl shadow-lg"
      />
      <p className="mt-6 text-center text-lg max-w-xl text-gray-300">
        We're working hard to bring you something amazing. Stay tuned for updates!
      </p>
    </div>
  );
};

export default Contact;
