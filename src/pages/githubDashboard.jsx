import React, { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GITHUB_API_URL = "https://flow-backend-ztda.onrender.com/api/github";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#00c49f", "#0088fe"];

export default function GithubDashboard() {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [languages, setLanguages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const headers = { 'auth-token': token };

      try {
        const [userRes, reposRes, languagesRes] = await Promise.all([
          axios.get(`${GITHUB_API_URL}/user`, { headers }),
          axios.get(`${GITHUB_API_URL}/user/repos`, { headers }),
          axios.get(`${GITHUB_API_URL}/user/languages`, { headers }),
        ]);

        setUser(userRes.data);
        setRepos(reposRes.data);
        setLanguages(languagesRes.data);
      } catch (err) {
        if (err.response) {
          // The server responded with a status code outside the 2xx range
          setError(err.response.data.error || `Server Error: ${err.response.status}. Please ensure your GitHub profile URL is set correctly.`);
        } else if (err.request) {
          // The request was made but no response was received (likely CORS or network issue)
          setError("Network Error: Could not connect to the server. Please check the server's CORS policy and your connection.");
        } else {
          // Something else happened while setting up the request
          setError("An unexpected error occurred while fetching data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-screen"><h2>⏳ Loading GitHub Stats...</h2></div>;
  if (error) return <div className="flex items-center justify-center h-screen text-center p-4"><h2 className="text-red-500">❌ {error}</h2></div>;

  const languageData = Object.entries(languages).map(([lang, count]) => ({ name: lang, value: count }));
  const topRepos = repos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 mb-6 text-indigo-600 hover:underline">
            <ArrowLeft size={20} /> Back to Dashboard
        </button>
      <h1 className="text-4xl font-bold mb-8">GitHub Insights</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-4">
                <img src={user.avatar_url} alt={user.login} className="w-24 h-24 rounded-full" />
                <div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <a href={user.html_url} target="_blank" rel="noreferrer" className="text-indigo-500">@{user.login}</a>
                </div>
            </div>
            <p className="text-gray-600 mt-4">{user.bio}</p>
            <div className="mt-4 space-y-2 text-sm">
                <p>👥 Followers: {user.followers} | Following: {user.following}</p>
                <p>📦 Public Repos: {user.public_repos}</p>
            </div>
        </div>

        {/* Language Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4">Language Usage</h3>
            <PieChart width={400} height={300}>
              <Pie data={languageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                {languageData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
        </div>

        {/* Top Repositories */}
        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-4">Top 5 Repositories by Stars</h3>
             <BarChart width={600} height={300} data={topRepos} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stargazers_count" fill="#8884d8" name="Stars" />
            </BarChart>
        </div>
      </div>
    </div>
  );
}
