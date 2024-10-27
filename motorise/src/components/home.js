import React from "react";
import { Link } from "react-router-dom";
import Button from "./ui/buttonComponent";
import { Target } from "lucide-react";

const Hero = () => {
  return (
    <div className="min-h-screen bg-white">
      <nav className="px-4 py-5 mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Motorise</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="px-4 mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Secure Your Space with Plate Recognition
          </h1>
          <p className="max-w-2xl mb-8 text-lg text-gray-600">
            Advanced plate number recognition system that enables real-time
            identification and monitoring of vehicles in secured areas.
          </p>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Link to="/signup">
              <Button className="w-full sm:w-auto px-8 py-6 text-lg bg-blue-600 text-white hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                className="w-full sm:w-auto px-8 py-6 text-lg border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Hero;
