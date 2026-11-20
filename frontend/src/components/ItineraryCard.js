import React from 'react';
import { Users, Clock, Loader2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export default function ItineraryCard({ tripId, title, destination, days, people, budget, highlights, tieBreakLog, onView }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-2 mb-4 animate-fade-in group w-[90%] md:w-[80%] ml-auto max-w-sm">
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-4 relative overflow-hidden">
        <Sparkles className="absolute -top-4 -right-4 w-20 h-20 text-white opacity-10" />
        <h4 className="font-bold text-white text-base mb-1 pr-8 line-clamp-1">{title}</h4>
        <div className="flex items-center gap-3 text-primary-100 text-xs font-medium">
          <span className="flex items-center gap-1"><MapPinIcon className="w-3.5 h-3.5" /> {destination}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {days} Days</span>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5">Budget</p>
            <p className="text-sm font-bold text-gray-900">{formatCurrency(budget)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-0.5 text-right">Travellers</p>
            <p className="text-sm font-bold text-gray-900 text-right flex items-center justify-end gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" /> {people}
            </p>
          </div>
        </div>

        {highlights && highlights.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 font-medium mb-2">Key Highlights:</p>
            <div className="space-y-1.5">
              {highlights.slice(0, 3).map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 flex-shrink-0" />
                  <span className="line-clamp-1">{h}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tieBreakLog && tieBreakLog.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-2.5 mb-4 border border-amber-100 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-amber-800">Tie-breaks applied</p>
              <p className="text-[9px] text-amber-700 mt-0.5">
                {tieBreakLog.length} vote {tieBreakLog.length === 1 ? 'tie was' : 'ties were'} resolved by the organizer.
              </p>
            </div>
          </div>
        )}

        <button 
          onClick={() => onView(tripId)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-xs font-bold transition-colors"
        >
          View Full Itinerary <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function MapPinIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
