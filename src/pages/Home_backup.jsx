import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Rocket, Terminal, Users } from 'lucide-react';
import coBrotherLogo from '../assets/Cobrother_logo.png';
import searchIcon from '../assets/Cobrother_Profile.png';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/domains?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const features = [
    {
      icon: <Globe size={40} strokeWidth={1.5} />,
      title: 'Explore Domain',
      description: 'Find the perfect identity for your next big tech project',
      link: '/domains'
    },
    {
      icon: <Rocket size={40} strokeWidth={1.5} />,
      title: 'Explore Venture',
      description: 'Discover innovative ventures and investment opportunities',
      link: '/ventures'
    },
    {
      icon: <Terminal size={40} strokeWidth={1.5} />,
      title: 'Explore Technology',
      description: 'Access cutting-edge software development tools and resources',
      link: '/cocreation'
    },
    {
      icon: <Users size={40} strokeWidth={1.5} />,
      title: 'Explore Community',
      description: 'Connect with talented developers and creative professionals',
      link: '/community'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <img src={coBrotherLogo} alt="CoBrother" className="h-10" />
          </div>
          <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-gray-900 mb-12">Let's Begin With Your Brand Name</h1>
          
          <form className="flex items-center gap-3 max-w-3xl mx-auto p-2 bg-white rounded-2xl shadow-xl border border-gray-200" onSubmit={handleSearch}>
            <img src={searchIcon} alt="Search" className="w-10 h-10 ml-2" />
            <input
              type="text"
              className="flex-1 px-4 py-3 text-lg focus:outline-none bg-transparent"
              placeholder="Search your domain name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="card-glow-hover group p-8 bg-white rounded-2xl shadow-lg transition-all duration-300">
                <div className="text-purple-600 mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm mb-6">{feature.description}</p>
                <button
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                  onClick={() => navigate(feature.link)}
                >
                  Explore →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 mb-2">
            © 2026 CoBrother™ All rights reserved.
            <br />
            Made with ❤️ in India.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            Email: <a href="mailto:cobrother.com@gmail.com" className="text-purple-600 hover:text-purple-700 transition-colors">cobrother.com@gmail.com</a> | Phone: 080 8575 8575
          </p>
        </div>
      </footer>
    </div>
  );
}
