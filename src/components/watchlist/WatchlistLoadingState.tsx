
import React from 'react';

export const WatchlistLoadingState = () => {
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
      <p className="text-gray-400 mt-2">Loading watchlist...</p>
    </div>
  );
};
