// src/pages/Landing.jsx
import React from 'react';
import { motion } from "framer-motion";
import { ArrowRight, GitBranch, MessageSquare, Users, Zap, Clock, BarChart2, Github } from "lucide-react";

// A self-contained Button component to replace the external dependency.
// It replicates the necessary styles from the original component.
const Button = ({ variant, size, className, children, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  const variantStyles = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };

  const sizeStyles = {
    default: "h-10 px-4 py-2",
    lg: "h-12 rounded-md px-8 text-lg",
  };

  const selectedVariant = variantStyles[variant] || variantStyles.default;
  const selectedSize = sizeStyles[size] || sizeStyles.default;

  return (
    <button
      className={`${baseStyles} ${selectedVariant} ${selectedSize} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};


export default function Landing() {
  const features = [
    {
      icon: <GitBranch className="w-8 h-8 text-blue-600" />,
      title: "Smart GitHub Integration",
      description: "Automate your workflow by linking tasks to GitHub issues and pull requests."
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Role-Based Access",
      description: "Manage your team with distinct permissions for leads and members."
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      title: "Integrated Video Calls",
      description: "Launch secure, multi-participant video calls directly in your workspace."
    },
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "AI-Powered Planning",
      description: "Break down complex tasks into actionable sub-tasks with AI assistance."
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: "Real-Time Updates",
      description: "See changes instantly with our WebSocket-powered live updates."
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-blue-600" />,
      title: "Automated Reporting",
      description: "Generate and customize weekly progress reports automatically."
    }
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gradient-to-br from-blue-50 to-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-2">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Flow</span>
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="hidden md:flex items-center space-x-4"
              >
                <a href="#features" className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium">Features</a>
                <a href="#how-it-works" className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium">How it Works</a>
                <a href="#pricing" className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-medium">Pricing</a>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex items-center space-x-2"
              >
                <Button variant="outline" className="rounded-lg border-indigo-100 text-indigo-600 hover:bg-indigo-50">
                  Log in
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 w-full">
        <div className="relative w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 lg:py-28">
            <div className="text-center">
              <motion.h1 
                className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                The <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">All-in-One</span> Platform for
              </motion.h1>
              <motion.p 
                className="text-2xl md:text-4xl font-bold text-gray-800 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Project Management & Team oration
              </motion.p>
              <motion.p 
                className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Flow replaces the need for multiple tools like Jira, Slack, and Zoom with a single, unified platform designed specifically for agile software teams.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 py-6 text-lg font-medium">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl px-8 py-6 text-lg font-medium border-gray-300">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </Button>
              </motion.div>
              
              <motion.div 
                className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-70"></div>
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80" 
                  alt="Flow Dashboard Preview" 
                  className="w-full h-auto object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Everything your team needs in one place
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Designed specifically for agile software development teams who move fast and stay aligned.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-600 to-blue-800">
            <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">Ready to transform your team's workflow?</span>
              </h2>
              <p className="mt-4 text-xl text-blue-100">
                Join thousands of teams who use Flow to ship better software, faster.
              </p>
              <div className="mt-8 flex justify-center">
                <Button className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3 text-lg font-medium rounded-xl">
                  Get Started for Free
                </Button>
              </div>
              <p className="mt-4 text-sm text-blue-200">
                No credit card required. 14-day free trial.
              </p>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center mr-2">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Flow</span>
              </div>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center text-sm text-gray-500">
                &copy; 2025 Flow, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}