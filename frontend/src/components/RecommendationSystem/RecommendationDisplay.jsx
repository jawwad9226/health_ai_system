import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RecommendationCard = ({ title, description, priority, category, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  const categoryIcons = {
    lifestyle: '🏃‍♂️',
    diet: '🥗',
    exercise: '💪',
    medical: '🏥',
    mental: '🧠',
    sleep: '😴'
  };

  return (
    <motion.div
      layout
      className="bg-white rounded-lg shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl" role="img" aria-label={category}>
              {categoryIcons[category] || '📋'}
            </span>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${priorityColors[priority]}`}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className={`w-6 h-6 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4"
            >
              <p className="text-gray-600">{description}</p>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => onAction('implement')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Implement
                </button>
                <button
                  onClick={() => onAction('dismiss')}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const RecommendationDisplay = ({ recommendations }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAction = (recommendationId, action) => {
    // Handle recommendation actions (implement/dismiss)
    console.log(`${action} recommendation ${recommendationId}`);
  };

  const filteredRecommendations = recommendations?.filter(rec => {
    const matchesFilter = activeFilter === 'all' || rec.category === activeFilter;
    const matchesSearch = rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rec.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const categories = ['all', 'lifestyle', 'diet', 'exercise', 'medical', 'mental', 'sleep'];

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Health Recommendations</h2>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  activeFilter === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredRecommendations.map(recommendation => (
            <RecommendationCard
              key={recommendation.id}
              {...recommendation}
              onAction={(action) => handleAction(recommendation.id, action)}
            />
          ))}
        </AnimatePresence>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No recommendations found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationDisplay;
