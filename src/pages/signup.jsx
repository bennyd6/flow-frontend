import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Github, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// This would typically be in another file, e.g., components/ui/Input.jsx
const InputField = React.forwardRef(({ icon, ...props }, ref) => (
  <div className="relative flex items-center">
    <span className="absolute left-4 text-gray-400">{icon}</span>
    <input
      ref={ref}
      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
      {...props}
    />
  </div>
));

export default function Signup() {
  const [credentials, setCredentials] = useState({ name: "", email: "", password: "", github: "" });
  let navigate = useNavigate(); // Initialize navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    // API Call
    const response = await fetch("http://localhost:3000/api/auth/createuser", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name: credentials.name, 
        email: credentials.email, 
        password: credentials.password,
        github: credentials.github 
      })
    });
    const json = await response.json();
    console.log(json);
    if (json.success) {
      // Save the auth token and redirect
      localStorage.setItem('token', json.authtoken);
      navigate("/dashboard"); // Redirect to dashboard
    } else {
      alert("Invalid credentials: " + (json.error || "Please check your input."));
    }
  };

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <motion.div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Create an Account</h1>
          <p className="text-gray-500 mt-2">Join our community and start your journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            icon={<User size={20} />}
            type="text"
            name="name"
            id="name"
            placeholder="Full Name"
            value={credentials.name}
            onChange={onChange}
            required
            minLength={5}
          />
          <InputField
            icon={<Mail size={20} />}
            type="email"
            name="email"
            id="email"
            placeholder="Email Address"
            value={credentials.email}
            onChange={onChange}
            required
          />
          <InputField
            icon={<Lock size={20} />}
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            value={credentials.password}
            onChange={onChange}
            required
            minLength={5}
          />
          <InputField
            icon={<Github size={20} />}
            type="url"
            name="github"
            id="github"
            placeholder="GitHub Profile URL (Optional)"
            value={credentials.github}
            onChange={onChange}
          />
          
          <motion.button
            type="submit"
            className="w-full flex items-center justify-center bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign Up <ArrowRight className="ml-2" size={20} />
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-indigo-600 hover:underline">
            Log In
          </a>
        </p>
      </motion.div>
    </div>
  );
}